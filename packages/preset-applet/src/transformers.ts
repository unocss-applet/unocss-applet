import type { SourceCodeTransformer } from '@unocss/core'
import type { TransformerAppletOptions } from './types'
import { escapeRegExp, escapeSelector } from '@unocss/core'
import { parse as parseVue } from '@vue/compiler-dom'
import { parseSync as parseJs } from 'oxc-parser'
import { encodeNonSpaceLatin, UNSUPPORTED_CHARS } from '../../shared/src'

type Span = [number, number]

// 我们能解析结构的文件类型：先用 AST 找出所有能放类名的 span（字符串字面量、
// 模板字符串的静态部分、class 属性值、模板文本节点），只在这些范围内改写。
// 其余文件类型回退到旧版整文件正则改写，保证裸片段调用和冷门文件类型不受影响。
const AST_ID_RE = /\.(?:vue|[cm]?[jt]sx?)$/

// 这个版本的 oxc-parser，`start`/`end` 偏移就是 UTF-16 code unit（用含非 BMP 字符的
// fixture 和 MagicString 对过），可以直接用。
function collectJsSpans(code: string, filename: string): Span[] {
  const ast = parseJs(filename, code, { sourceType: 'module' })
  if (ast.errors?.length)
    throw new Error(`JS parse errors in ${filename}`)
  const spans: Span[] = []
  function visit(node: any): void {
    if (!node || typeof node !== 'object')
      return
    if (node.type === 'Literal' && typeof node.value === 'string') {
      spans.push([node.start, node.end])
    }
    else if (node.type === 'TemplateLiteral') {
      // 只收静态文本部分；`${expr}` 里是可执行代码
      for (const quasi of node.quasis)
        spans.push([quasi.start, quasi.end])
    }
    for (const key in node) {
      if (key === 'start' || key === 'end')
        continue
      const value = node[key]
      if (Array.isArray(value))
        value.forEach(visit)
      else if (value && typeof value === 'object' && value.type)
        visit(value)
    }
  }
  visit(ast.program)
  return spans
}

function collectVueSpans(code: string): Span[] {
  // `whitespace: 'preserve'` —— 默认的 'condense' 会改写文本节点的空白字符，
  // 既弄乱偏移量，也会损坏 script/wxs 块里的 JS。解析错误通过 onError 收集
  // （parse 不在返回的根节点上暴露 errors，3.4/3.5 均如此，已实测）。
  const parseErrors: unknown[] = []
  const ast = parseVue(code, {
    comments: true,
    whitespace: 'preserve',
    onError: err => parseErrors.push(err),
  })
  if (parseErrors.length)
    throw new Error('Vue template parse errors')
  const spans: Span[] = []
  // 文本子节点是可执行代码的元素：只改写字符串字面量
  const codeTags = new Set(['script', 'wxs'])
  // 内容既不是模板文本也不是 JS 的元素：永不改写
  const opaqueTags = new Set(['style'])

  // `wrap` 用于裸表达式（`cond ? 'a' : 'b'`、对象字面量这类），得包一层括号才能按
  // program 解析；script/wxs 内容本身就是完整 program，不能再包
  function pushJsStrings(content: string, offset: number, filename: string, wrap: boolean): void {
    try {
      const source = wrap ? `(${content})` : content
      const shift = wrap ? -1 : 0
      const jsSpans = collectJsSpans(source, filename)
      for (const [start, end] of jsSpans)
        spans.push([offset + shift + start, offset + shift + end])
    }
    catch {
      // 解析不了的片段：宁可跳过不改写，也不能把整个片段标成可改写——
      // 那会重新引入 #114（片段内的 `m[1]` 这类下标被改坏）
    }
  }

  function visit(node: any, codeMode: boolean): void {
    if (!node || typeof node !== 'object')
      return
    switch (node.type) {
      case 1: { // 元素
        const inner = codeTags.has(node.tag)
        if (opaqueTags.has(node.tag))
          return
        // hover 属性的值是类名位置：transformerHover 会把 hover: 工具类搬进来，而
        // postprocess 生成的选择器是别名化形式（.bg-red_a_50），值不改写的话运行时
        // 类名与 CSS 对不上，按压态样式静默失效
        const hoverAttrNames = ['hover-class', 'hoverClass']
        for (const prop of node.props) {
          if (prop.type === 6) { // 静态属性：只有 class/className 和 hover-class 里是类名；placeholder/aria 等属性的值是可见文案，改了会破坏界面
            if (prop.value && (prop.name === 'class' || prop.name === 'className' || hoverAttrNames.includes(prop.name)))
              spans.push([prop.value.loc.start.offset, prop.value.loc.end.offset])
          }
          else if (prop.type === 7 && prop.exp) { // 指令表达式：只有类名语义的指令里的字符串字面量可改写。
            // 其余指令（@click 实参、v-model、自定义指令）是运行时代码，改写会破坏行为——
            // `@click="copy('p-2.5')"` 若被改成 `copy('p-2_a_5')`，剪贴板内容就坏了。
            const arg = prop.arg ? String(prop.arg.content) : undefined
            // v-bind="obj"（无 arg）取不到类名语义，不碰；仅 :class / :hover-class 这类带 arg 的绑定才处理
            const isClassDirective = prop.name === 'bind' && !!arg
              && ['class', 'className', ...hoverAttrNames].includes(arg)
            if (isClassDirective)
              pushJsStrings(prop.exp.content, prop.exp.loc.start.offset, 'expr.ts', true)
          }
        }
        for (const child of node.children ?? [])
          visit(child, inner)
        return
      }
      case 2: { // 文本
        if (codeMode)
          pushJsStrings(node.content, node.loc.start.offset, 'script.ts', false)
        else
          spans.push([node.loc.start.offset, node.loc.end.offset])
        return
      }
      case 3: // 注释 —— 永不改写
        return
      case 5: { // 插值 `{{ expr }}` —— 表达式不碰。插值是展示文本/运行时求值，里面的字符串字面量
        // （函数实参、展示文案）不是类名位置，改写会改变用户可见输出和运行时行为。
        // 动态类名请写在 :class 里，那里会处理字符串字面量。
        return
      }
      case 9: { // v-if —— 逐个分支遍历
        for (const branch of node.branches ?? []) {
          for (const child of branch.children ?? []) {
            visit(child, codeMode)
          }
        }
        return
      }
      case 11: { // v-for —— 遍历子节点
        for (const child of node.children ?? []) {
          visit(child, codeMode)
        }
        return
      }
      default:
        for (const child of node.children ?? [])
          visit(child, codeMode)
    }
  }
  visit(ast, false)
  return spans
}

/**
 * Source-code transformer，让小程序不兼容的工具类在模板里能用。
 *
 * 小程序 wxss 引用不了含 `.`、`:`、`[`、`/` 等字符的类名，而这些写法在 UnoCSS 里很常见
 * （`py-3.5`、`dark:bg-red`、`bg-[url(...)]`）。对每个匹配到的工具类，这个 transformer 会：
 *   1. 生成一个小程序安全的别名：不支持字符替换为 `_a_`，非 ASCII 字符（比如中文）
 *      编码成字符码；
 *   2. 把别名注册成 shortcut 指回原始工具类，并保留原有的 layer；
 *   3. 把源码里的工具类改写成别名，让模板引用小程序安全的类名。
 *
 * 配套的 postprocess 在 `presetApplet` 里把生成的 CSS selector 改写成一致的形式，
 * 两边闭环。只处理源码里的裸工具类 token —— attributify 由 `transformerAttributify` 负责。
 *
 * 改写为什么是安全的：对认识的文件类型（.vue、.js/.ts/.jsx/.tsx），先解析代码
 * （Vue 模板编译器 / oxc），工具类只有落在能放类名的 span 里才会被改写 —— 字符串字面量、
 * 模板字符串的静态部分、class 属性值、模板文本节点。可执行代码（`m[1]` 这类数组下标、
 * 计算属性 key、注释、正则字面量、插值表达式）永远匹配不上，日常 JS 不会被动到（#114）。
 * 不认识的文件类型或解析失败的文件回退到旧版整文件正则改写。行为边界由
 * `test/transformer-applet-source-safety.test.ts` 固定下来，改坏会失败。
 */
export function transformerApplet(options: TransformerAppletOptions = {}): SourceCodeTransformer {
  const unsupportedChars = [...UNSUPPORTED_CHARS, ...(options.unsupportedChars ?? [])]
  const escapedUnsupportedChars = unsupportedChars.map(char => escapeSelector(char))
  const charTestReg = new RegExp(`[${escapedUnsupportedChars.join('')}]`)
  const charReplaceReg = new RegExp(`[${escapedUnsupportedChars.join('')}]`, 'g')
  // 匹配负值工具类开头的 `-`（比如 `-ml-1.5`）；在生成别名前先去掉，避免这个减号被当成
  // 不支持字符改写成 `_a_`。
  const negativeReplaceReg = /^-+/
  // 仅旧版回退路径使用：块注释（`/* */`）和 HTML 注释（`<!-- -->`），预填进 `claimed`，
  // 这样注释里的工具类不会被改写。
  const commentReg = /\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g

  return {
    name: 'transformer-applet',
    enforce: 'pre',
    async transform(s, id, ctx) {
      const { uno, tokens } = ctx
      // 前面的 pre transformer（transformerHover / transformerAttributify）改写过的文件，
      // 源码已经被整文件 overwrite 一次；此时不能再用 s.original 上的偏移做 slice/overwrite
      // ——MagicString 对已编辑区间的 slice 会抛错，之前那个吞错分支会让整个文件的工具类
      // 静默漏改。改成以当前内容为准：解析、匹配、收集编辑，最后用一次整文件 overwrite 回写
      // （整文件 overwrite 允许叠加，见 MagicString 语义）。
      const source = s.hasChanged() ? s.toString() : s.original

      const { matched } = await uno.generate(source, { preflights: false })

      // 只保留真正含不支持字符的工具类；跳过 attributify 风格的 token（`[...]` 外含 `=`），
      // 那些归 `transformerAttributify` 管。`=` 在括号里没关系——data 属性变体就是这么写的
      // （如 `group-data-[state=open]:font-bold`）。
      const replacements = Array.from(matched)
        .filter(i => charTestReg.test(i))
        .filter(i => !i.replace(/\[[^\]]*\]/g, '').includes('='))
        // #109：在纯文本模板里（如 `<text>...translate--1/2</text>`），extractor 会抽出
        // 混入 HTML 标签残留字符的 token（如 `translate--1/2</text>`）。别名化它们会破坏源码；
        // 而 `<`/`>` 不会出现在真实的类名 token 里，所以直接一律拒绝。故意用黑名单而不是
        // 白名单——白名单得枚举所有合法 token 可能用到的字符（`!`、`#`、`.`、`/`……），
        // 而且 UnoCSS 以后加了新 token 形式时会静默丢掉工具类。
        .filter(i => !/[<>]/.test(i))
        // 长的排前面，这样一个 token 如果包含另一个（如 `dark:p-2.5` 包含 `p-2.5`），
        // 先拿走自己的完整 span；否则内层的 `p-2.5` 会先被改写，外层 token 的别名就
        // 写不进源码了，模板里会留下小程序不认的类名 `dark:p-2_a_5`（`:` 还在）。
        .sort((a, b) => b.length - a.length)

      const spans = AST_ID_RE.test(id)
        ? (() => {
            try {
              return id.endsWith('.vue') ? collectVueSpans(source) : collectJsSpans(source, id)
            }
            catch {
              // 已知类型的文件解析失败：跳过改写而不是回退整文件正则——回退会把
              // `m[1] = 2` 这类代码改坏（#114 的原始场景），漏一个工具类比损坏脚本轻
              return []
            }
          })()
        : null

      // 已占用的源码区间；后面的匹配只要和其中任何一个重叠就跳过。span 路径下它记录
      // 已经改写过的范围（magic-string 对重叠改写会抛异常）；回退路径下它还会额外
      // 预填注释 span，让注释里的工具类不被改写——下面的边界正则分不清注释和类名列表。
      // 回退路径也故意不处理 `//` 行注释：`https://` 和正则字面量里的 `//` 对无状态
      // 正则来说和真正的行注释无法区分。
      const claimed: [number, number][] = []
      // 已编辑文件路径下收集的编辑：起点 -> [别名, 被替换 token 的长度]。起点唯一
      // （同一区间不会命中两次——claimed 重叠检查会跳过后续重叠匹配）
      const dirtyEdits = new Map<number, [string, number]>()
      if (!spans) {
        for (const m of source.matchAll(commentReg))
          claimed.push([m.index!, m.index! + m[0].length])
      }

      for (let replace of replacements) {
        let replaced = replace.replace(charReplaceReg, '_a_')
        replaced = encodeNonSpaceLatin(replaced)

        // 解析一次原始工具类，读出它的 layer，别名 shortcut 就能保留分层
        // （`utilities` vs `shortcuts`），保证 CSS 顺序正确
        const util = await uno.parseToken(replace)
        const layer = util?.[0]?.[4]?.layer

        // 两边都去掉开头的 `-`，让 shortcut 映射 `ml-1_a_5` -> `ml-1.5`（而不是
        // `-ml-1_a_5` -> `-ml-1.5`）；负号不进别名就不会被改写成 `_a_`。
        replace = replace.replace(negativeReplaceReg, '')
        replaced = replaced.replace(negativeReplaceReg, '')

        // 注册 别名 -> 原始工具类 的 shortcut；tokens.add 让 UnoCSS 在提取/扫描时
        // 把别名当作已知 token
        uno.config.shortcuts.push([replaced, replace, { layer }])
        tokens.add(replaced)

        // 按独立 token 匹配每个工具类——`[A-Za-z0-9_]` 的前后瞻防止部分匹配
        // （如 `p-2.5` 匹配进 `p-2.55`）。对当前生效的 `source` 做匹配（文件未被前面的
        // transformer 改过时就是 `s.original`），多个 token 之间偏移量才不会失效。
        // `replace` 已经去掉了开头 `-`（见上），所以 `-ml-1.5` 这样的负值工具类匹配到的
        // 是 `ml-1.5` 的 span，改写的也是去掉负号的别名——源码里的 `-` 原样保留，CSS
        // 生成时由 negative variant 补回。
        const boundaryReg = new RegExp(`(?<![A-Za-z0-9_])${escapeRegExp(replace)}(?![A-Za-z0-9_])`, 'g')
        for (const m of source.matchAll(boundaryReg)) {
          const start = m.index!
          const end = start + replace.length
          // span 路径：只改写落在 class span 内的出现（#114）
          if (spans && !spans.some(([cs, ce]) => start >= cs && end <= ce))
            continue
          if (claimed.some(([cs, ce]) => start < ce && end > cs))
            continue
          // 已编辑的文件整文件 overwrite 回写，不会与已有编辑重叠；未编辑的文件按
          // 精确 span overwrite。两种路径下匹配的 source 就是即将写入的内容，无需再校验
          if (source !== s.original) {
            dirtyEdits.set(start, [replaced, replace.length])
            claimed.push([start, end])
          }
          else {
            s.overwrite(start, end, replaced)
            claimed.push([start, end])
          }
        }
      }

      // 已被前面的 transformer 改过的文件：把收集到的编辑叠在当前内容上，从右往左应用，
      // 一次整文件 overwrite 回写（MagicString 允许整文件 overwrite 叠加在已有编辑之后）
      if (dirtyEdits.size) {
        let out = source
        for (const [start, [text, length]] of [...dirtyEdits].sort((a, b) => b[0] - a[0]))
          out = out.slice(0, start) + text + out.slice(start + length)
        s.overwrite(0, s.original.length, out)
      }
    },
  }
}
