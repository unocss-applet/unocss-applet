import type { SourceCodeTransformer } from '@unocss/core'
import type { TransformerHoverOptions } from './types'
import MagicString from 'magic-string'
import { encodeNonSpaceLatin, UNSUPPORTED_CHARS } from '../../shared/src'

export * from './types'

/**
 * 把 `hover:xxx` 工具类挪进小程序原生的 `hover-class` 属性。
 *
 * 小程序的 wxss 不支持 `:hover` 伪类，UnoCSS 生成的 `hover:xxx` 工具类在运行时会被
 * 直接丢掉。原生的 `view` / `button` 组件是靠字符串类型的 `hover-class` 属性在按压时
 * 生效的。本 transformer 把静态 `class` / `className` 里的 `hover:` 工具类搬到
 * `hover-class`（去掉 `hover:` 前缀，因为属性本身已经表示按压态），让这些工具类在小程序端
 * 真正起作用。搬进 hover-class 的 token 会同时做别名化（不支持字符换 `_a_`、非 ASCII
 * 编码成字符码，与 `presetApplet` 的 postprocess 同一套规则）并注册 shortcut，
 * 让运行时类名与生成的 CSS 选择器一致——不别名化的话 `hover:bg-red/50` 搬出去是
 * `bg-red/50`，CSS 侧是 `.bg-red_a_50`，wxss 引用不到，按压态静默失效。
 *
 * `hover-class` 只接受字符串（微信/支付宝官方文档），所以输出永远是单个空格拼接的字符串，
 * 不会是数组。永远不会输出空值：`hover-class=""` 虽然无害，但 `hover-class="none"` 是关闭
 * 按压效果的保留值，输出空值有和框架默认值撞车的风险。
 *
 * 适用范围：`.vue`（uni-app / Taro-vue）和 `.jsx` / `.tsx`（Taro React）。正则匹配的坑和
 * 对策与 `transformer-attributify` 相同——完整清单见它的文件头注释（JSX 表达式容器里的
 * `>`、Fragment 短语法、注释等）。尤其注意：JSX 表达式容器里的任何 `>` 都会被当成标签的
 * 结束 `>`，元素只匹配到那个 `>` 为止，然后被静默跳过。
 *
 * 搬移条件：一个 token 只有在去掉开头的 `!` important 修饰符和 `hover:` 前缀之后，剩余部分
 * (a) 是真实的 UnoCSS 工具类，且 (b) 不再带任何变体限定——判定方式是 `[...]` 任意值分组
 * 之外是否存在顶层 `:`——才会被搬移。所以 `hover:bg-red`、`!hover:bg-red`、
 * `hover:bg-[url(http://x)]`、`hover:bg-red/50` 都会搬；`hover:dark:bg-red`、
 * `hover:focus:bg-red`、`hover:peer-focus:bg-red`、`dark:hover:bg-red` 不会（hover-class
 * 没法表达 dark/focus/media/peer 这些条件）。搬移后，开头的 `!` 会重新加回剩余部分。
 *
 * 不处理的情况：
 * - 带其他变体的 `hover:`（无论变体在哪一侧）：`dark:hover:`、`md:hover:`、`hover:dark:`、
 *   `hover:focus:`、`hover:peer-focus:` —— 留在 `class` 里（见上面的搬移条件）。
 * - 动态表达式 `:class="[cond ? 'hover:a' : 'hover:b']"` / `className={[...]}` 里的
 *   `hover:` token：正则没法可靠地从 JS 表达式里提取出字符串字面量。这种情况请手写
 *   `hover-class`。
 * - 不是工具类的 `hover:` token（剩余部分 UnoCSS 不认识）：留在 `class` 里。
 */
const splitterRE = /[\s'"`;]+/g

// 约定：捕获组 1 必须是完整的属性段，从标签名后的第一个属性开始，到闭合 `/?>` 前的最后一个
// 属性为止。下面的属性循环通过 `segOffset` 把 attrSeg 里的下标映射回完整匹配里的下标，
// 依赖这个约定成立。
// eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/no-dupe-disjunctions
const elementRE = /<\w(?=.*>)[\w:.$-]*\s(((".*?>?.*?")|.*?)*?)\/?>/gs
// 无引号的 JSX 值由 `\S+` 捕获，它会在 `{...}` 表达式容器里的第一个空白处截断
// （`{a ? b : c}` → `{a`）。后面的 JSX 属性处理会通过 `scanBracedExpression` 重新提取
// 完整容器。
// eslint-disable-next-line regexp/no-super-linear-backtracking
const attributeRE = /([[?\w\u00A0-\uFFFF-:()#%.\]]+)(?:\s*=\s*('[^']*'|"[^"]*"|\S+))?/g

/**
 * 跳过属性值里的一段引号内容（`'...'`、`"..."` 或模板字符串 `` `...` ``），返回闭引号之后
 * 的下标。供 `scanBracedExpression` 使用，让字符串/模板字符串里的花括号不干扰深度计数。
 */
function skipQuoted(seg: string, quoteStart: number, end: number): number | null {
  const quote = seg[quoteStart]
  for (let i = quoteStart + 1; i < end; i++) {
    if (seg[i] === '\\') {
      i++
      continue
    }
    if (seg[i] === quote)
      return i + 1
  }
  return null
}

/**
 * 扫描 `seg[braceStart..end)` 里从 `braceStart` 开始的配平 `{...}` 表达式。返回含两端花括号
 * 的 `{...}` 片段，配不平则返回 `null`。与 `transformer-attributify` 里的同名函数一致，
 * 目的是让属性值里的 JSX 三元表达式 / 对象字面量 / 模板字符串能被完整读出，而不是被
 * `attributeRE` 在第一个空白处截断。
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
      i = after - 1
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

/** 对 `matchStrTemp` 的一次待应用的位置编辑：把 `[start, end)` 替换为 `replacement`。 */
interface AttrEdit { start: number, end: number, replacement: string }

/**
 * 判断 `body` 里是否有顶层的 `:` 变体分隔符（即不在任意值 `[...]` 分组内的 `:`）。纯工具类
 * body（`bg-red`、`bg-[url(http://x)]`、`content-['a:b']`、`w-[calc(100%-1px)]`、
 * `bg-red/50`）没有顶层 `:`；任何变体写法（`dark:`、`focus:`、`active:`、`peer-focus:`、
 * `md:`、`hover:` 自身等）都有，而 `hover-class` 表达不了这些条件（没法按 focus/dark/media/
 * peer 生效），所以必须留在 `class` 里。
 *
 * 这个判定比去看解析出来的选择器形状更可靠：伪类变体（`focus:`、`active:`）编译后是单个
 * 复合选择器，没有空白、也没有 `@media` 父级，按选择器形状判断会把它们误判成纯工具类。
 * body 里的顶层冒号就是变体写法的标志。
 */
function hasVariantSeparator(body: string): boolean {
  let depth = 0
  for (const ch of body) {
    if (ch === '[')
      depth++
    else if (ch === ']')
      depth = Math.max(0, depth - 1)
    else if (ch === ':' && depth === 0)
      return true
  }
  return false
}

export function transformerHover(options: TransformerHoverOptions = {}): SourceCodeTransformer {
  // 别名化用的替换正则。与 presetApplet 的 postprocess 同一套字符表（UNSUPPORTED_CHARS），
  // 保证搬进 hover-class 的别名与 CSS 选择器一致。本包暂无 unsupportedChars 选项，
  // 若 presetApplet 将来自定义了字符表，两侧需同步
  const escapedUnsupportedChars = UNSUPPORTED_CHARS.map(char => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const charReplaceReg = new RegExp(`[${escapedUnsupportedChars.join('')}]`, 'g')
  return {
    name: 'transformer-hover',
    enforce: 'pre',
    async transform(s, id, { uno, tokens: unoTokens }) {
      if (!/\.(?:vue|[jt]sx)$/.test(id))
        return

      const isJsx = /\.(?:j|t)sx$/.test(id)
      const classAttrName = options.classAttributeName ?? (isJsx ? 'className' : 'class')
      // Vue 用 kebab-case 的 `hover-class`；JSX 用 camelCase 的 `hoverClass`。动态绑定的
      // 写法分别是 `:hover-class`（Vue）和 `hoverClass={expr}`（JSX）。
      const hoverAttrName = options.hoverAttributeName ?? (isJsx ? 'hoverClass' : 'hover-class')

      const code = new MagicString(s.toString())

      let changed = false
      const elementMatches = code.original.matchAll(elementRE)
      for (const eleMatch of elementMatches) {
        const start = eleMatch.index!
        let matchStrTemp = eleMatch[0]
        const attrSeg = eleMatch[1] || ''
        // attrSeg 在完整标签匹配里的偏移：元素正则是 `<\w[\w:.$-]*\s(...)`，第一个空白就是
        // 标签名和属性的分界，attrSeg 紧跟其后。这里用 `search(/\s/)` 而不是 `indexOf(' ')`，
        // 为的是兼容标签名和第一个属性之间出现制表符或换行的情况——那种时候 `indexOf(' ')`
        // 会返回 -1，后面所有下标都会错位到标签名上，把标签改坏。
        const segOffset = eleMatch[0].search(/\s/) + 1
        const attributes = Array.from(attrSeg.matchAll(attributeRE))

        // 从当前元素的 class 属性里收集到的 hover token，稍后搬进 hover-class。
        const hoverTokens: string[] = []
        // 每个静态 class 属性各自的编辑描述。畸形但被容忍的写法里，一个元素可能有多个
        // `class` 属性，必须逐个改写——只记一份 (start,end,value) 的话只会记住最后一个，
        // 前面的 `class` 属性里的 `hover:` token 会原样留着，同时出现在旧字面量和新
        // `hover-class` 里。
        interface ClassSlotEdit { valueStart: number, valueEnd: number, kept: string }
        const classSlotEdits: ClassSlotEdit[] = []
        // 待应用的位置编辑，从右往左应用，保证前面的下标始终有效。
        const edits: AttrEdit[] = []
        // 已有 hover-class 槽位的状态：在属性遍历时识别出来，后面往里合并，而不是注入
        // 重复的属性。
        let hoverAttrValue = '' // 静态字面量值（如果有）
        let hoverAttrStart = -1 // 静态 hover-class 值的 span（引号之间）
        let hoverAttrEnd = -1
        // 动态 hover-class（`:hover-class="expr"` / `hoverClass={expr}`）：稍后把 expr 包进
        // 模板字符串，让收集到的 token 在运行时追加，不丢原值。
        let hoverDynContent = '' // 原始的 `{expr}` 或 `"expr"` 片段
        let hoverDynStart = -1 // matchStrTemp 里的绝对 span
        let hoverDynEnd = -1
        // 无值简写（`<div hover-class/>`）：记录裸属性 token 的 span，后面把它改写成带值
        // 形式，而不是注入重复的属性。
        let hoverShorthandStart = -1
        let hoverShorthandEnd = -1

        // 预扫描 `{...}` 表达式容器，避免容器内部的零散子 token（来自 spread 或被
        // `attributeRE` 切碎的值绑定）被误读成独立属性。
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
          }
        }
        const isInsideConsumed = (pos: number): boolean => {
          for (const [cs, ce] of consumedRanges) {
            if (pos > cs && pos <= ce)
              return true
          }
          return false
        }

        let skipElement = false
        for (const attribute of attributes) {
          const matchStr = attribute[0]
          const name = attribute[1]
          const attrStart = attribute.index!

          if (isInsideConsumed(attrStart))
            continue

          let content = attribute[2]
          const contentOffset = content ? matchStr.indexOf(content) : -1

          // JSX 值绑定 `attr={expr}`：如果 `attributeRE` 在花括号内的第一个空白处截断了值，
          // 就重新提取完整的 `{...}`。
          let braceUnbalanced = false
          if (isJsx && content && content.startsWith('{') && !content.endsWith('}')) {
            const braceStart = attrStart + contentOffset
            const full = scanBracedExpression(attrSeg, braceStart, attrSeg.length)
            if (full)
              content = full
            else
              braceUnbalanced = true
          }
          if (braceUnbalanced) {
            skipElement = true
            break
          }

          const isJsxDynamicValue = isJsx && !!content && /^\{[\s\S]*\}$/.test(content)

          // --- class / className 槽位 ---
          // Vue 动态 `:class` / JSX 动态 `className={expr}`：正则没法可靠地从 JS 表达式里
          // 提取 `hover:` 字面量，所以动态类绑定原样保留，只收集静态字面量。
          const isStaticClass = name === classAttrName && !isJsxDynamicValue && !!content
            && !content.startsWith('{')
          if (isStaticClass) {
            const rawValue = content.replace(/['"`]/g, '')
            const tokens = rawValue.split(splitterRE).filter(Boolean)
            const kept: string[] = []
            let movedAny = false
            for (const tok of tokens) {
              // 去掉开头的 `!` important 修饰符，让 `hover:bg-red` 和 `!hover:bg-red` 都符合
              // 搬移条件（UnoCSS 把它们当成同一条规则，加 `!important` 应用）。搬移时 `!`
              // 会重新加回剩余部分。
              const important = tok.startsWith('!')
              const stripped = important ? tok.slice(1) : tok
              // 只有独立的 `hover:`（前面没有其他变体）符合条件；`dark:hover:bg-red` 这种
              // token 开头是 `dark:` 不是 `hover:`，会正确地留在原地——hover-class 表达
              // 不了变体限定。
              if (stripped.startsWith('hover:')) {
                const body = stripped.slice('hover:'.length)
                const moved = important ? `!${body}` : body
                // 校验的是重新拼好的 token（不只是 body），这样 `!hover:!bg-red` 这种双重
                // important 的输入不会被输出成非法的 `!!bg-red`。同时用
                // `hasVariantSeparator` 的顶层冒号检查拒绝带变体限定的 body
                // （`hover:focus:`、`hover:dark:`）。
                if (!hasVariantSeparator(body) && (await uno.parseToken(moved))?.[0]) {
                  // 搬进 hover-class 的值是运行时类名，而 postprocess 生成的 CSS 选择器是
                  // 别名化形式（`bg-red/50` → `.bg-red_a_50`）；不别名化的话两侧对不上，
                  // 按压态样式静默失效。用与 postprocess 同一套字符表/编码，保证别名一致
                  const alias = encodeNonSpaceLatin(important ? `!${body}`.replace(charReplaceReg, '_a_') : body.replace(charReplaceReg, '_a_'))
                  if (alias !== moved) {
                    // 注册 别名 -> 原始工具类 的 shortcut，让别名 token 也能生成 CSS
                    // （与 transformerApplet 的做法一致）
                    const util = await uno.parseToken(moved)
                    uno.config.shortcuts.push([alias, moved, { layer: util?.[0]?.[4]?.layer }])
                    unoTokens?.add?.(alias)
                  }
                  hoverTokens.push(alias)
                  movedAny = true
                  continue
                }
              }
              kept.push(tok)
            }
            if (movedAny) {
              // 记录当前这个 class 属性值的 span，供下面改写。每个静态 class 属性都有自己
              // 的编辑，多个 `class` 属性都能被清理。span 是引号之间的内容
              // （contentOffset..+content.length 覆盖含引号的值，+1/-1 收窄到内部值）。
              const valueStart = segOffset + attrStart + contentOffset + 1
              classSlotEdits.push({
                valueStart,
                valueEnd: valueStart + content.length - 2,
                kept: kept.join(' '),
              })
            }
            continue
          }

          // --- hover-class 槽位识别 ---
          // 覆盖 hover 属性的几种写法：静态 `hover-class` / `hoverClass`、Vue 动态
          // `:hover-class`、JSX 动态 `hoverClass={expr}`。
          const isHoverAttr = name === hoverAttrName
            || (!isJsx && name === `:${hoverAttrName}`)
          if (!isHoverAttr)
            continue

          if (isJsxDynamicValue || (!isJsx && name.startsWith(':'))) {
            // 动态 hover-class。稍后把表达式包进模板字符串。span 覆盖引号内的值
            // （Vue `:hover-class="expr"`）或花括号表达式（JSX `hoverClass={expr}`）；
            // Vue 侧包模板字符串时会去掉外层引号。
            hoverDynContent = content
            hoverDynStart = segOffset + attrStart + contentOffset
            hoverDynEnd = hoverDynStart + content.length
          }
          else if (content) {
            // 静态 hover-class 字面量——读出它的 token，与收集到的合并。
            hoverAttrValue = content.replace(/['"`]/g, '')
            hoverAttrStart = segOffset + attrStart + contentOffset + 1
            hoverAttrEnd = hoverAttrStart + content.length - 2
          }
          else {
            // 无值简写（`<div hover-class/>`）。没有值 span 可覆盖，但属性存在——记录它的
            // span，下面直接改写成带值形式，而不是注入重复的 `hover-class="..."`。
            hoverShorthandStart = segOffset + attrStart
            hoverShorthandEnd = hoverShorthandStart + matchStr.length
          }
        }

        if (skipElement)
          continue

        if (!hoverTokens.length)
          continue

        // 先合并已有的静态 hover-class token，保持它们相对新收集 token 的顺序
        // （issue 示例 2：`text-xl bg-red`）。
        const merged = hoverAttrValue
          ? [...hoverAttrValue.split(splitterRE).filter(Boolean), ...hoverTokens]
          : hoverTokens

        if (hoverAttrStart !== -1) {
          // 覆盖已有的静态 hover-class 值。
          edits.push({
            start: hoverAttrStart,
            end: hoverAttrEnd,
            replacement: merged.join(' '),
          })
        }
        else if (hoverDynContent) {
          // 把动态 hover-class 表达式包进模板字符串，用 `${...}` 插值在运行时追加收集到的
          // token：
          //   Vue :hover-class="expr"  -> :hover-class="`${expr} tokens`"
          //   JSX hoverClass={expr}    -> hoverClass={`${expr} tokens`}
          // 原表达式原样放进 `${}`，运行时值不会丢；收集到的 token 作为静态后缀追加。
          // Vue 的 content 是带引号的 `"expr"`；JSX 的是花括号 `{expr}`。两者都
          // slice(1, -1) 取出内部表达式。
          const expr = hoverDynContent.slice(1, -1)
          const template = `\`\${${expr}} ${merged.join(' ')}\``
          // 保留 Vue 绑定原有的引号字符，避免表达式里含 `"`（包在 `'...'` 里）时和外层
          // 引号撞车——写死 `"` 会提前终止属性值，改坏标记。
          const vueQuote = hoverDynContent[0] === '\'' ? '\'' : '"'
          edits.push({
            start: hoverDynStart,
            end: hoverDynEnd,
            // Vue `:hover-class="expr"` -> `:hover-class="`${expr} tokens`"`（带引号）。
            // JSX `hoverClass={expr}` -> `hoverClass={`${expr} tokens`}`（带花括号）。
            replacement: isJsx ? `{${template}}` : `${vueQuote}${template}${vueQuote}`,
          })
        }
        else if (hoverShorthandStart !== -1) {
          // 把无值简写 `hover-class` 改写成带值的 `hover-class="..."`。
          edits.push({
            start: hoverShorthandStart,
            end: hoverShorthandEnd,
            replacement: `${hoverAttrName}="${merged.join(' ')}"`,
          })
        }
        // 「原本没有 hover-class 属性」的情况由下面的注入逻辑处理（在 collapse 之后），
        // 因为插入位置要基于折叠后的文本计算，而不是原始文本。

        // 改写每个静态 class 属性（删掉搬走的 token）。class 被删空时，把编辑范围扩大到
        // 整个 `class="..."` 属性，直接删掉。每个槽位独立处理，多个 `class` 属性都能清理。
        for (const { valueStart, valueEnd, kept } of classSlotEdits) {
          if (kept) {
            edits.push({ start: valueStart, end: valueEnd, replacement: kept })
          }
          else {
            // 扩大到吞掉整个 `name="value"` 属性。valueStart 指向开引号内的第一个字符；
            // 向后退到属性名，向前越过闭引号。
            // matchStrTemp 里属性的排布：...<sp>name<sp?>=<sp?>"value"<sp?>...
            let i = valueStart - 1 // 开引号
            i-- // 现在在 `=` 或空格上
            while (i >= 0 && /[\s=]/.test(matchStrTemp[i]!))
              i--
            // i 现在在属性名的最后一个字符上；继续向前走到属性名开头。
            while (i >= 0 && /[\w$:.-]/.test(matchStrTemp[i]!))
              i--
            const attrNameStart = i + 1
            edits.push({
              start: attrNameStart,
              end: valueEnd + 1,
              replacement: '',
            })
          }
        }

        // 从右往左应用编辑，保证前面的下标始终有效。
        edits.sort((a, b) => b.start - a.start)
        for (const { start: eStart, end: eEnd, replacement: eRep } of edits)
          matchStrTemp = `${matchStrTemp.slice(0, eStart)}${eRep}${matchStrTemp.slice(eEnd)}`

        // 折叠属性删除留下的孤立空白（感知引号和花括号），思路与 `transformer-attributify`
        // 相同。
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
            flushRun()
            const close = scanBracedExpression(matchStrTemp, i, matchStrTemp.length)
            if (close) {
              collapsed += close
              i += close.length - 1
              continue
            }
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
        matchStrTemp = collapsed
        // 去掉最后一个属性和裸闭合 `>` 之间的杂散空格，但自闭合 `/>` 前保留一个
        // （`<div />` 在 Vue 和 JSX 里都是惯用写法）。和 `transformer-attributify`
        // 的折叠 pass 逐字一致——保持相同输入产出相同空白形状。
        matchStrTemp = matchStrTemp.replace(/(["'}])\s+(>)$/, '$1$2')

        // 没有现成的 hover-class（无静态值、无动态绑定、无简写）且有 token 要写时，
        // 注入 hover-class 属性。放在折叠 pass 之后，插入位置才能基于当前文本算对。
        if (hoverAttrStart === -1 && !hoverDynContent && hoverShorthandStart === -1 && hoverTokens.length) {
          const selfClosing = matchStrTemp.endsWith('/>')
          const insertPos = matchStrTemp.length - (selfClosing ? 2 : 1)
          const sep = matchStrTemp[insertPos - 1] === ' ' ? '' : ' '
          matchStrTemp = `${matchStrTemp.slice(0, insertPos)}${sep}${hoverAttrName}="${hoverTokens.join(' ')}"${matchStrTemp.slice(insertPos)}`
        }

        code.overwrite(start, start + eleMatch[0].length, matchStrTemp)
        changed = true
      }

      // 真的有变化时才回写源码。空文件（或没有可处理元素）时 `s.overwrite(0, 0, ...)`
      // 或 `(0, len, 原文)` 会抛异常或白做一次；MagicString 拒绝零长度改写。
      if (changed)
        s.overwrite(0, s.original.length, code.toString())
    },
  }
}

export default transformerHover
