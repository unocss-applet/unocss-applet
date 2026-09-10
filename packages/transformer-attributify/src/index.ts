import type { SourceCodeTransformer } from '@unocss/core'
import type { TransformerAttributifyOptions } from './types'
import { isValidSelector } from '@unocss/core'
import MagicString from 'magic-string'

export * from './types'

/**
 * 小程序端的 attributify 模式（uni-app / Taro 的小程序端）。
 *
 * 上游 `@unocss/preset-attributify` 靠运行时的属性选择器（如 `[un-text='']`）工作，
 * 而小程序的 wxss 不支持属性选择器。所以本 transformer 改为在构建期把模板里的
 * attributify 写法编译成普通的 `class="..."`，例如
 * `<view text="red" mt-2 />` -> `<view class="text-red mt-2" />`。
 *
 * 处理范围：`.vue`（uni-app / Taro-vue）和 `.jsx`/`.tsx`（Taro React）文件。JSX 里的动态
 * 表达式（`text={cond ? 'a' : 'b'}`、`{...spread}`）没法在构建期静态编译，所以 JSX 侧只
 * 处理静态属性和无值的简写属性。
 *
 * JSX 侧的已知边界（正则匹配元素，不是完整的 JSX 解析器）：
 * - Fragment 简写 `<` + `>...</` + `>` 不会命中（开头没有 `\w`）。
 * - 长得像标签的字符串/注释子节点（比如字符串子节点 `'<div>'`，或包含 `<foo>` 的 JSX
 *   注释）可能被误读成真标签。别把这类内容写进模板，或者只在手写标记上启用本
 *   transformer 就没事。
 * - JSX 表达式容器里的 `>` 会被当成标签的结束 `>`，所以属性表达式里带 `>` 的元素——
 *   箭头函数（`onClick={() => fn()}`）、比较运算（`disabled={a > b}`）、字符串字面量里的
 *   `<`/`>`——只会被匹配到那个 `>` 为止，然后被整个跳过（元素上的工具类会静默丢失，
 *   不报错）。这是真实 Taro/React 代码里最常见的坑；把这类元素上的工具类挪进字面量
 *   `className="..."` 就能避开。
 */
const splitterRE = /[\s'"`;]+/g
// 契约：捕获组 1 必须是完整的属性段——从标签名后的第一个属性开始，到闭合 `/?>` 之前的
// 最后一个属性为止。下方的属性循环靠 `indexOf(attrSeg)` 算出这个组在整个匹配里的偏移，
// 再把正则索引从 attrSeg 坐标系换算到整段匹配的坐标系——两处都依赖这个约定。
// 改这里的正则（加捕获组、裁剪段落）都要重新核对 `segOffset`。
function genElementRE(ignoreTagPrefixes: string[] = []): RegExp {
  if (!ignoreTagPrefixes.length)
    // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/no-dupe-disjunctions
    return /<\w(?=.*>)[\w:.$-]*\s(((".*?>?.*?")|.*?)*?)\/?>/gs

  const patterns = ignoreTagPrefixes.flatMap((prefix) => {
    const baseLower = prefix.toLowerCase()
    const capitalized = baseLower.charAt(0).toUpperCase() + baseLower.slice(1)
    const hyphenated = `${baseLower}-`

    return [capitalized, hyphenated]
  })

  // 走到这里 `ignoreTagPrefixes` 一定非空（上面已经提前返回），每个前缀经过 `flatMap`
  // 会产出至少 2 项，所以 `patterns` 永远不为空——不需要处理空前瞻分支。
  const ignorePattern = `(?!${patterns.join('|')})`
  return new RegExp(`<${ignorePattern}\\w(?=.*>)[\\w:.$-]*\\s(((".*?>?.*?")|.*?)*?)\\/?>`, 'gs')
}
// 无引号的 JSX 值用 `\S+` 捕获，会在 `{...}` 表达式容器内的第一个空白处被截断
// （`{a ? b : c}` → `{a`）。JSX 属性处理会通过下面的 `scanBracedExpression` 重新取出完整
// 容器；改动这里对值的捕获逻辑时，必须连着这层补救一起核对。
// eslint-disable-next-line regexp/no-super-linear-backtracking
const attributeRE = /([[?\w\u00A0-\uFFFF-:()#%.\]]+)(?:\s*=\s*('[^']*'|"[^"]*"|\S+))?/g

/**
 * 跳过属性值里的一段引号内容（`'...'`、`"..."` 或模板字符串 `` `...` ``），返回结束引号
 * 后面那个字符的下标。在这一层，模板字符串被当作单个 token（不解析 `${}` 插值）——
 * 调用方只需要知道字面量在哪结束，这样内部的 `{`/`}` 就不会被算进花括号深度。
 * 引号没在 `end` 之前闭合时返回 `null`。
 */
function skipQuoted(seg: string, quoteStart: number, end: number): number | null {
  const quote = seg[quoteStart]
  for (let i = quoteStart + 1; i < end; i++) {
    if (seg[i] === '\\') {
      i++ // 跳过转义字符
      continue
    }
    if (seg[i] === quote)
      return i + 1
  }
  return null
}

/**
 * 从 `braceStart` 开始，扫描 `seg[braceStart..end)` 里配平的 `{...}` 表达式。
 *
 * `attributeRE` 用 `\S+` 捕获无引号的 JSX 值，会在 `{...}` 表达式容器内的第一个空白处被
 * 截断（比如 `{cond ? 'a' : 'b'}` → `{cond`）。这里通过配对花括号重新取出完整容器，
 * 返回包含两侧花括号的 `{...}` 片段；花括号不配平（源码被截断）时返回 `null`。
 *
 * 表达式里的字符串/模板字面量通过 `skipQuoted` 跳过，所以字面量里的花括号（比如
 * `'}'`、`${obj}`）不会干扰深度计数。嵌套模板的 `${...}` 插值仍然没有完整解析——插值
 * 表达式里出现 `}` 还是可能算错配平——但这种写法在 className 表达式里足够少见，
 * 这一层在实际使用中够用了。
 */
function scanBracedExpression(seg: string, braceStart: number, end: number): string | null {
  if (seg[braceStart] !== '{')
    return null
  let depth = 0
  for (let i = braceStart; i < end; i++) {
    const ch = seg[i]
    if (ch === '\'' || ch === '"' || ch === '`') {
      const after = skipQuoted(seg, i, end)
      if (after === null)
        return null
      i = after - 1 // for 循环的 ++ 会把 i 带到结束引号的下一个字符
      continue
    }
    if (ch === '{') {
      depth++
    }
    else if (ch === '}') {
      depth--
      if (depth === 0)
        return seg.slice(braceStart, i + 1)
    }
  }
  return null
}

/** 一条待应用的位置编辑：把 `matchStrTemp` 的 `[start, end)` 替换为 `replacement`。 */
interface AttrEdit { start: number, end: number, replacement: string }

const defaultIgnoreAttributes = ['placeholder', 'setup', 'lang', 'scoped']

export function transformerAttributify(options: TransformerAttributifyOptions = {}): SourceCodeTransformer {
  const ignoreAttributes = options?.ignoreAttributes ?? defaultIgnoreAttributes
  const nonValuedAttribute = options?.nonValuedAttribute ?? true
  const prefix = options.prefix ?? 'un-'
  const prefixedOnly = options.prefixedOnly ?? false
  const deleteAttributes = options.deleteAttributes ?? true
  const elementRE = genElementRE(options.ignoreTagPrefixes ?? [])

  return {
    name: 'transformer-attributify',
    enforce: 'pre',
    async transform(s, id, { uno }) {
      // 只处理 Vue SFC 和 JSX/TSX；正则假设的是 HTML 风格的模板语法
      if (!/\.(?:vue|[jt]sx)$/.test(id))
        return

      const isJsx = /\.(?:j|t)sx$/.test(id)

      const code = new MagicString(s.toString())

      const elementMatches = code.original.matchAll(elementRE)
      for (const eleMatch of elementMatches) {
        const start = eleMatch.index!
        let matchStrTemp = eleMatch[0]
        let hasStaticClass = false
        // 静态 class 字面量只用来决定追加的工具类前面要不要加空格；是否存在由上面的
        // `hasStaticClass` 跟踪，因为字面量可能是空串（而 `''` 是假值，直接判断会误报不存在）。
        let staticClassValue = ''
        // JSX 的动态 `className={expr}` / `class={expr}`：记录属性名、原始 `{expr}` 片段，
        // 以及这个 token 在 matchStrTemp 里的绝对 span，之后把工具类用模板字符串追加进去，
        // 保留运行时表达式。保留 span 是为了让改写按位置锚定，而不是靠 `indexOf`——
        // 后者会命中第一个子串匹配，可能碰巧匹配到某个兄弟属性的值，把它改坏
        // （静态路径避开的「首个匹配」陷阱，这里是同一个坑）。
        let dynamicClassName = ''
        let dynamicClassContent = ''
        let dynamicClassStart = -1
        let dynamicClassEnd = -1
        const attrSelectors: string[] = []
        const attrSeg = eleMatch[1] || ''
        // 元素正则是 `<\w[\w:.$-]*\s(...)`，第一个空白正好是标签名和属性的分割点，
        // attrSeg 紧跟在它后面。用 `search(/\s/)` 而不是 `indexOf(' ')`，兼容制表符/换行
        // 的情况（如 `<view\n  m-2 />`）——那种时候 `indexOf(' ')` 会返回 -1，后面所有
        // 下标都错位到标签名上，把标签改坏。用 `indexOf(attrSeg)` 则会在无值属性的名字
        // 恰好等于标签名时出错（如 `<flex flex />`）：attrSeg `"flex "` 在 `<flex ` 里
        // 也匹配，偏移会落在标签名上而不是属性段上。
        const segOffset = eleMatch[0].search(/\s/) + 1
        const attributes = Array.from(attrSeg.matchAll(attributeRE))

        // 待应用的位置编辑，确认收集到工具类后一次性应用到 matchStrTemp。取代之前的
        // `String.replace` 方案——那会改写第一个子串匹配，可能碰巧命中某个值恰好等于
        // `name` 或 `existsClass` 的无关属性
        // （比如 `<div data-foo="text-red" className="text-red" mt-2 />`）。下面的下标都是
        // 相对 matchStrTemp 的。
        const edits: AttrEdit[] = []
        // 在静态 `class`/`className` 的结束引号处排队一个插入点；按引用持有这个编辑对象，
        // 等 `attrSelectors` 确定后直接填内容，不用重新扫描编辑列表。
        let appendEdit: AttrEdit | null = null

        // 只为属性 token 本身（不含周围空白）推入一条删除编辑。相邻的删除因此不会在
        // 共享的空格上重叠——重叠会让后面那些按原始字符串算好下标的编辑全部失效。
        // 删除留下的孤儿空白由所有编辑应用之后的一次折叠 pass 统一清理。
        const pushRemoval = (attrStart: number, attrLen: number): void => {
          const absStart = segOffset + attrStart
          edits.push({ start: absStart, end: absStart + attrLen, replacement: '' })
        }

        // `attributeRE` 会把 JSX 的 `{...}` 表达式容器切成开头一段（值绑定的 `name={fragment`
        // 或展开语法的 `{fragment`）加零散的子 token（`{a ? b : c}` 里的 `?`、`b`、`:`、`c`）。
        // `{` 本身不在 `attributeRE` 的字符类里，永远不会单独成为 token——展开语法的第一个
        // token 是 `{` 后面的内容（`{...x}` 是 `...`，`{ a: b }` 是 `a:`），而容器内部碰巧长得
        // 像工具类的标识符（`flex`、`block`）否则会被当作属性消费并删除，把运行时对象改坏
        // （`{ a: flex }` -> `{ a: }`）。
        //
        // 所以提前扫描一遍 attrSeg，记下每个花括号容器的 span。循环里的惰性水位线不够用：
        // 展开语法的第一个零散 token（`...`，或 `{ a: flex }` 里的 `flex`）不是以 `{` 开头的，
        // 永远触发不了能把水位线推进的重提取，但它同样必须被跳过。展开语法可能出现在属性
        // 列表的任何位置（`<Comp className="x" {...rest} />`），所以需要提前拿到全部容器的
        // span。起始位置严格落在某个 span 内的 token 是内部零散 token，直接跳过；值绑定的
        // 开头 `name=` token 起点在 `{` 之前，不受影响，会继续走到下面的逐 token 重提取。
        const consumedRanges: Array<[number, number]> = []
        if (isJsx) {
          for (let i = 0; i < attrSeg.length; i++) {
            if (attrSeg[i] !== '{')
              continue
            const full = scanBracedExpression(attrSeg, i, attrSeg.length)
            if (full) {
              consumedRanges.push([i, i + full.length - 1])
              i += full.length - 1
            }
            // 不配平——先放着；下面的逐 token 重提取会标记 skipElement。
          }
        }
        // `pos` 是否严格落在某个已消费容器的 span 内。起点取半开区间：值绑定的开头 token
        // （从属性名开始，在 `{` 之前）不算已消费；`{` 之后的内部零散 token 算。
        const isInsideConsumed = (pos: number): boolean => {
          for (const [s, e] of consumedRanges) {
            if (pos > s && pos <= e)
              return true
          }
          return false
        }

        let skipElement = false
        for (const attribute of attributes) {
          const matchStr = attribute[0]
          const name = attribute[1]
          const attrStart = attribute.index!

          // 这个 token 的起点严格落在之前扫描的 `{...}` 容器内——它是展开语法或值绑定的
          // 内部零散 token，不是真属性；跳过。
          if (isInsideConsumed(attrStart))
            continue

          // 跳过 Vue 动态绑定（`:foo="..."`）——值是 JS 表达式，不是工具类 token
          if (name.startsWith(':'))
            continue

          let content = attribute[2]

          // `content` 在 matchStr 里的偏移——既用来定位 `{...}` 容器的起点（供重提取），
          // 也用来算动态 class 改写所需的属性结束 span。无条件计算，因为下面的动态 class
          // span 即使在 content 没有被重提取时也需要它（比如不带空白的 `{c}`，或 `=` 两侧
          // 有空格的 `className = {c}`）。
          const contentOffset = content ? matchStr.indexOf(content) : -1

          // JSX 值绑定 `attr={expr}`：`attributeRE` 用 `\S+` 捕获无引号值，会在 `{...}`
          // 容器内的第一个空白处截断（`{cond ? 'a' : 'b'}` → `{cond`）。通过花括号配平重新
          // 取出完整 `{...}`，这样三目、对象字面量、模板字符串、带空格的标识符都能被动态
          // 检测覆盖。不带空白的 `{expr}`（如 `{c}`）已经被 `\S+` 完整捕获；只有被截断的
          // 情况需要重提取。
          let braceUnbalanced = false
          if (isJsx && content && content.startsWith('{') && !content.endsWith('}')) {
            const braceStart = attrStart + contentOffset
            const full = scanBracedExpression(attrSeg, braceStart, attrSeg.length)
            if (full) {
              content = full
            }
            else {
              // 表达式容器在匹配到的片段里不配平——没法安全地分类或改写。跳过整个元素，
              // 免得这个属性或它的 `m-2` 简写被静默丢弃或重复添加。
              braceUnbalanced = true
            }
          }
          if (braceUnbalanced) {
            skipElement = true
            break
          }

          // JSX 动态绑定 `attr={expr}`（`class`/`className` 除外，它们在下面单独处理以保留
          // 运行时值）携带的是 JS 表达式，无法在构建期静态编译成工具类 token——跳过。
          // Vue 的 `:attr="..."` 已经被上面的 `:` 判断跳过了。
          const isJsxDynamicValue = isJsx && !!content && /^\{[\s\S]*\}$/.test(content)
          if (isJsxDynamicValue && !['class', 'className'].includes(name))
            continue

          const nonPrefixed = name.replace(prefix, '')
          if (!ignoreAttributes.includes(nonPrefixed)) {
            if (!content) {
              // 无值属性，如 `<div mt-2 />` -> class `mt-2`
              if (prefixedOnly && prefix && !name.startsWith(prefix))
                continue
              if (isValidSelector(nonPrefixed) && nonValuedAttribute) {
                // 只有 UnoCSS 确实认识这个 token 是工具类才保留
                if (await uno.parseToken(nonPrefixed)) {
                  attrSelectors.push(nonPrefixed)
                  deleteAttributes && pushRemoval(attrStart, matchStr.length)
                }
              }
            }
            else {
              // 有值属性，如 `<div text="red" p="2" />`
              if (name.includes('hover-class'))
                // `hover-class` 是小程序原生属性，永远不是 attributify 的目标
                continue
              if (['class', 'className'].includes(name)) {
                // Vue 的 `:class` 已经被上面的 `name.startsWith(':')` 过滤了；这里的 `name`
                // 一定就是字面的 `class` 或 `className`，不含 `:`。
                if (isJsxDynamicValue) {
                  // JSX 的 `className={expr}` / `class={expr}`——构建期读不到 expr，但记下属性名
                  // 和原始 `{expr}` 片段，之后把工具类用模板字符串追加进去，保留运行时表达式。
                  // span 覆盖 `name=` + `=` 两侧可能的空白 + （可能重提取过的）完整 `{...}`
                  // 表达式。用 `contentOffset` 锚定而不是硬编码 `name.length + 1`——后者在 `=`
                  // 两侧有空格时（如 `className = {c}`）会偏短，表达式尾部字符落在改写范围外，
                  // 产生非法 JSX。
                  dynamicClassName = name
                  dynamicClassContent = content
                  dynamicClassStart = segOffset + attrStart
                  dynamicClassEnd = dynamicClassStart + contentOffset + content.length
                }
                else {
                  // 静态 `class="foo"` / `className="foo"`——在这个属性的结束引号处排队一个
                  // 零宽度插入点，让收集到的工具类追加进字符串内部，而不是追加到标签里第一个
                  // 值子串匹配的位置。替换内容等 `attrSelectors` 确定后在下面填入；按引用持有
                  // 编辑对象而不是用字符串哨兵——万一 class 值本身包含哨兵字符串就有歧义了。
                  hasStaticClass = true
                  staticClassValue = content.replace(/['"`]/g, '')
                  const insertAt = segOffset + attrStart + matchStr.length - 1
                  appendEdit = { start: insertAt, end: insertAt, replacement: '' }
                  edits.push(appendEdit)
                }
              }
              else {
                if (prefixedOnly && prefix && !name.startsWith(prefix))
                  continue

                const result: string[] = []

                for (const v of content.split(splitterRE).filter(Boolean)) {
                  let token = v
                  // 值简写：b="~ green dark:red dark:2"
                  if (v.includes(':')) {
                    // 带变体前缀的值，如 `text` 属性上的 `dark:red` -> 先试 `dark:text-red`，
                    // 前缀形式不是工具类时退回原始 token
                    const splitV = v.split(':')
                    token = `${splitV[0]}:${splitV[1]}`
                    if (await uno.parseToken(`${nonPrefixed}-${splitV[1]}`))
                      result.push(`${splitV[0]}:${nonPrefixed}-${splitV[1]}`)
                    else if (await uno.parseToken(`${splitV[0]}:${splitV[1]}`))
                      result.push(`${splitV[0]}:${splitV[1]}`)
                  }
                  else {
                    // `~` 指属性名本身（自引用简写）；
                    // 开头的 `!` 是 UnoCSS 的 important 修饰符，保持在拼出的 token 前面
                    if (v === '~')
                      token = nonPrefixed
                    else if (v.startsWith('!'))
                      token = `!${nonPrefixed}-${v.slice(1)}`
                    else
                      token = `${nonPrefixed}-${v}`
                    if (await uno.parseToken(token))
                      result.push(token)
                  }
                }

                attrSelectors.push(...result)
                result.length && deleteAttributes && pushRemoval(attrStart, matchStr.length)
              }
            }
          }
        }

        if (skipElement)
          continue

        if (attrSelectors.length) {
          if (hasStaticClass && appendEdit) {
            // 填入之前在静态 class 属性结束引号处排队的插入点。已有值为空时跳过开头的
            // 分隔空格，这样 `class=""` 加上工具类得到 `class="m-2"`，而不是 `class=" m-2"`。
            const sep = staticClassValue ? ' ' : ''
            appendEdit.replacement = `${sep}${attrSelectors.join(' ')}`
          }
          else if (dynamicClassContent) {
            // JSX 的 `className={expr}` / `class={expr}`——把 expr 包进模板字符串，让生成的
            // 工具类在运行时追加，不丢失原值。比如 `className={c}` + `m-2` ->
            // `className={`${c} m-2`}`。
            // 锚定到属性循环里记录的 span，而不是对拼好的目标做 `indexOf`——后者会命中第一个
            // 子串匹配，可能碰坏某个值恰好等于 `className={...}` 的兄弟属性。
            const expr = dynamicClassContent.slice(1, -1)
            const utilities = attrSelectors.join(' ')
            // 用普通字符串拼接组装 `name={`${expr} utilities`}`，不用 `String.replace`——
            // 这样 `expr` 里的 `$&`、`$1`、`$<name>`、`$$` 会原样复制，不会被当成替换模式解释。
            const replacement = `${dynamicClassName}={\`\${${expr}} ${utilities}\`}`
            edits.push({ start: dynamicClassStart, end: dynamicClassEnd, replacement })
          }

          // 把排队的位置编辑按从右到左的顺序一次应用，这样改写后面的 span 时前面下标依然有效。
          // span 是半开区间：[start, end)。纯 token 删除不会重叠，所以即使静态 class 属性的
          // 结束引号处有带前导空格的插入，不重叠的性质也成立。
          edits.sort((a, b) => b.start - a.start)
          for (const { start: eStart, end: eEnd, replacement: eRep } of edits)
            matchStrTemp = `${matchStrTemp.slice(0, eStart)}${eRep}${matchStrTemp.slice(eEnd)}`

          // 属性删除会留下原来分隔属性用的空白，连续删除会在标签头部产生连续空格，还会在
          // 闭合 `>`/`/>` 前留一个尾随空格。把连续空白折叠成单个空格，并整个丢掉尾随的那段
          // ——但只处理引号属性值和 JSX `{...}` 表达式容器之外的部分：这两处可能合法地包含
          // 多个空格（或其他对空白敏感的内容），必须逐字节保留。把花括号表达式整体原样拷贝
          // 也顺带保护了里面嵌套的模板字符串（比如本 transformer 生成的
          // `className={`${expr} m-2`}`），它自己的反引号字符串没法可靠跟踪，因为 `${...}`
          // 插值里可能有不配平的引号。逐字符扫描，跟踪引号和花括号状态；O(标签长度)，
          // 标签都很短。
          let collapsed = ''
          let runStart = -1
          const flushRun = (): void => {
            if (runStart !== -1) {
              collapsed += ' '
              runStart = -1
            }
          }
          for (let i = 0; i < matchStrTemp.length; i++) {
            const ch = matchStrTemp[i]!
            if (ch === '\'' || ch === '"') {
              flushRun()
              const close = matchStrTemp.indexOf(ch, i + 1)
              collapsed += matchStrTemp.slice(i, close === -1 ? matchStrTemp.length : close + 1)
              i = close === -1 ? matchStrTemp.length - 1 : close
              continue
            }
            if (ch === '{') {
              // 把配平的 `{...}` 表达式原样拷贝，跳过内部的引号段落，这样字符串里的 `}`
              // 不会弄乱深度。这里的花括号检测是尽力而为：`${...}` 插值里的 `}` 没有建模，
              // 但这种写法在 className 表达式里很少见，最坏结果是表达式没被折叠（少了一次
              // 折叠），不会把内容改坏。
              flushRun()
              const close = scanBracedExpression(matchStrTemp, i, matchStrTemp.length)
              if (close) {
                collapsed += close
                i += close.length - 1
                continue
              }
              // 不配平——退回逐字符处理，宁可少折叠也不截断
            }
            if (/\s/.test(ch)) {
              if (runStart === -1)
                runStart = i
            }
            else {
              flushRun()
              collapsed += ch
            }
          }
          // 这里故意不 flush 尾随的空白段——这样才能丢掉属性删除后留在闭合 `>`/`/>` 前
          // 的孤儿空格。
          matchStrTemp = collapsed
          // 去掉最后一个属性和非自闭合 `>` 之间的多余空格
          // （如 `<div class="x" >` -> `<div class="x">`）。自闭合 `/>` 保留空格——
          // `<div />` 在 Vue 和 JSX 里都是惯用写法。
          matchStrTemp = matchStrTemp.replace(/(["'}])\s+(>)$/, '$1$2')

          // 原本没有 class 属性时注入一个。放在上面的编辑和折叠之后做，插入位置基于当前的
          // matchStrTemp 计算，而不是原始字符串——否则触及闭合 `>` 的删除会让插入点落进
          // 存活文本的中间。折叠 pass 已经把 `>`/`/>` 前的尾随空格去掉了，所以注入的属性
          // 需要自己带一个前导空格，与最后一个存活的属性（或标签名）分开。
          if (!hasStaticClass && !dynamicClassContent) {
            const classAttr = isJsx ? 'className' : 'class'
            const selfClosing = matchStrTemp.endsWith('/>')
            const insertPos = matchStrTemp.length - (selfClosing ? 2 : 1)
            // 插入点前面已有分隔空格时跳过前导空格——折叠 pass 会在标签名（或最后一个
            // 存活属性）和闭合 `>` 之间保留单个空格，再注入一个会得到 `<div  class=`。
            const sep = matchStrTemp[insertPos - 1] === ' ' ? '' : ' '
            matchStrTemp = `${matchStrTemp.slice(0, insertPos)}${sep}${classAttr}="${attrSelectors.join(' ')}"${matchStrTemp.slice(insertPos)}`
          }

          code.overwrite(start, start + eleMatch[0].length, matchStrTemp)
        }
      }

      s.overwrite(0, s.original.length, code.toString())
    },
  }
}

export default transformerAttributify
