import type { UnocssPluginContext } from '@unocss/core'
import { presetApplet, transformerApplet } from '@unocss-applet/preset-applet'
import { createGenerator } from '@unocss/core'
import MagicString from 'magic-string'
import { describe, expect, it } from 'vitest'

const transformer = transformerApplet()

describe('transformer-applet', async () => {
  const uno = await createGenerator({
    presets: [
      presetApplet({
        presetOptions: {
          dark: 'media',
        },
        unsupportedChars: ['~', ' '],
      }),
    ],
  })

  async function transform(code: string) {
    const s = new MagicString(code)
    await transformer.transform(s, '', {
      tokens: new Set<string>(),
      uno,
    } as UnocssPluginContext)
    return s.toString()
  }

  it('basic', async () => {
    const transformTargets = [
      '-ml-1.5 ml-1.5 -mt-2',
      'bg-[url(https://api.iconify.design/carbon:bat.svg?color=red)]',
    ]

    const result = await transform(transformTargets.join(' '))
    expect(result).toMatchInlineSnapshot(`"-ml-1_dot_5 ml-1_dot_5 -mt-2 bg-_lbracket_url_lparen_https_colon__slash__slash_api_dot_iconify_dot_design_slash_carbon_colon_bat_dot_svg_question_color_equals_red_rparen__rbracket_"`)
  })

  // #109：旧实现用 `code.replaceAll(replace, replaced)` 做全文替换，任何子串都会命中，
  // 所以改写 `p-2.5` 时会把 `p-2.55` 里的 `.5` 一起改坏。边界正则（lookahead
  // `(?![A-Za-z0-9_])`）必须把每个带小数点的工具类整体改写。
  it('decimal scale: no partial match into a longer sibling (#109)', async () => {
    expect(await transform('p-2.5 p-2.55 p-2.5')).toMatchInlineSnapshot(`"p-2_dot_5 p-2_dot_55 p-2_dot_5"`)
    expect(await transform('text-2.5 text-2.55')).toMatchInlineSnapshot(`"text-2_dot_5 text-2_dot_55"`)
  })

  // 带变体前缀的工具类（`dark:p-2.5`）和嵌在它里面的裸工具类（`p-2.5`）都会出现在
  // `matched` 里。按长度从长到短排序 + 占位机制让外层 token 认领完整 span；否则模板里
  // 会留下 `dark:p-2_a_5` 这种小程序不合法的类名（`:` 没被改写）。
  it('variant prefix overlapping a nested utility', async () => {
    expect(await transform('dark:p-2.5 p-2.5')).toMatchInlineSnapshot(`"dark_colon_p-2_dot_5 p-2_dot_5"`)
    expect(await transform('hover:bg-[#fff]')).toMatchInlineSnapshot(`"hover_colon_bg-_lbracket__hash_fff_rbracket_"`)
  })

  // class 属性和动态绑定里的工具类必须被改写——小程序端模板里的类名必须和 wxss 里
  // `_a_` 别名后的选择器对得上。`:class` 里的字符串字面量是特意写的，不是要修的 bug。
  it('rewrites utilities in static class and dynamic template literal', async () => {
    expect(await transform('<view class="p-2.5 m-1.5" />')).toMatchInlineSnapshot(`"<view class="p-2_dot_5 m-1_dot_5" />"`)
    // eslint-disable-next-line no-template-curly-in-string -- literal `${x}` is the fixture under test
    expect(await transform(':class="`p-2.5 ${x}`"')).toMatchInlineSnapshot(`":class="\`p-2_dot_5 \${x}\`""`)
  })

  // lookahead/lookbehind 边界：`x-p-2.5` 和 `p-2.5x` 都不是 UnoCSS 工具类，不会出现在
  // `matched` 里，必须原样通过。
  it('leaves non-utility neighbours untouched', async () => {
    expect(await transform('x-p-2.5')).toMatchInlineSnapshot(`"x-p-2.5"`)
    expect(await transform('p-2.5x')).toMatchInlineSnapshot(`"p-2.5x"`)
  })

  it('mixed utility list', async () => {
    expect(await transform('text-red p-2.5 m-2 hover:bg-blue-100')).toMatchInlineSnapshot(`"text-red p-2_dot_5 m-2 hover_colon_bg-blue-100"`)
  })

  // #109 问题 2：纯文本模板上 extractor 会提取出混入 HTML 标签字符的 token（比如
  // `translate--1/2</text>`）。改写它们会破坏源码，所以含 `<`/`>` 的 token 直接拒绝；
  // `</text>` 原样保留，两个真实工具类照常改写。
  it('rejects tokens with HTML tag bleed-through (#109 problem 2)', async () => {
    expect(await transform('<text>absolute top-1/2 left-1/2 translate--1/2</text>')).toMatchInlineSnapshot(`"<text>absolute top-1_slash_2 left-1_slash_2 translate--1/2</text>"`)
  })

  // #115：`[&>view]` 这类任意变体把子选择器写在 `[...]` 里，`>` 在那里是合法写法，不能和
  // #109 问题 2 的标签残留一起被拒。只拒绝括号外的 `<`/`>`。
  it('keeps child-combinator arbitrary variants (#115)', async () => {
    // 别名按 UNSUPPORTED_CHARS 逐字符编码：`[`、`&`、`>`、`]`、`:` 分别使用不同的英文名称，
    // `view` 和 `text-red` 原样保留。
    const alias = '_lbracket__ampersand__gt_view_rbracket__colon_text-red'
    expect(await transform('<view class="[&>view]:text-red" />')).toBe(`<view class="${alias}" />`)
    // 模板里的类名和生成的选择器必须是同一个别名，否则小程序端匹配不到，样式静默失效。
    const { css } = await uno.generate('<view class="[&>view]:text-red" />', { preflights: false })
    expect(css).toContain(`.${alias}>view`)
  })

  // #109 问题 1：注释里的工具类必须原样保留，而紧挨着的 class 属性里同一个工具类要照常
  // 改写。块注释（`/* */`）和 HTML 注释（`<!-- -->`）会被匹配；`//` 行注释故意不匹配，
  // 因为对无状态正则来说 URL 里的 `//` 和真行注释无法区分（见 transformers.ts）。
  it('skips utilities inside block and HTML comments (#109 problem 1)', async () => {
    expect(await transform('<!-- p-2.5 note --><view class="p-2.5" />')).toMatchInlineSnapshot(`"<!-- p-2.5 note --><view class="p-2_dot_5" />"`)
    expect(await transform('/* see p-2.5 */ <view class="p-2.5" />')).toMatchInlineSnapshot(`"/* see p-2.5 */ <view class="p-2_dot_5" />"`)
  })

  // `!`（important）和其他不支持字符一样要被改写，而且不能被 #109 问题 2 的过滤器误删——
  // 对 `<`/`>` 的拒绝必须精准，不能误伤。
  it('keeps important-flag utilities through the #109 filter', async () => {
    expect(await transform('bg-red! p-2.5!')).toMatchInlineSnapshot(`"bg-red_exclamation_ p-2_dot_5_exclamation_"`)
  })

  // #106：`important` 的三种写法都必须把前缀/后缀的 `!`（以及 `important:` 变体里的 `:`）
  // 改写掉，改写后的类名才是小程序安全的；配套的 postprocess 保证源码和选择器一致——
  // 对应的 `!important` CSS 断言见 `preset-applet-wind3.test.ts`。
  it('aliases every `important` spelling (#106)', async () => {
    // 前缀形式：`!` 是 token 的第一个字符
    expect(await transform('!font-bold')).toMatchInlineSnapshot(`"_exclamation_font-bold"`)
    // 变体 + important：`:` 和 `!` 都要改写；长优先排序保证外层 token 拿到完整 span
    expect(await transform('hover:!font-bold')).toMatchInlineSnapshot(`"hover_colon__exclamation_font-bold"`)
    // `important:` 变体：`:` 把它和工具类隔开
    expect(await transform('important:font-bold')).toMatchInlineSnapshot(`"important_colon_font-bold"`)
    // 混一个普通工具类，确认改写不会波及相邻内容
    expect(await transform('text-red !font-bold')).toMatchInlineSnapshot(`"text-red _exclamation_font-bold"`)
  })

  // #108：默认 extractor 会把三元表达式切开，光秃秃的 `?` 自己成为一个 token。内置的
  // `questionMark` 规则（匹配 `/^(where|\?)$/`）会把 `?` 当成工具类放进 `matched`；而 `?`
  // 是不支持字符，transformer 会把它改成 `_a_`，三元表达式就被改坏成 `true _a_ 1 : 0`。
  // `presetApplet` 移除了这条规则，`?` 就到不了 transformer，script 完好无损。`where`
  // 也被同一条规则匹配，属于同一个修复。
  it('does not rewrite the ternary `?` in script (#108)', async () => {
    expect(await transform('onLaunch(() => { const a = true ? 1 : 0 })'))
      .toMatchInlineSnapshot(`"onLaunch(() => { const a = true ? 1 : 0 })"`)
    // 同一段源码里的真实工具类照常改写——修复必须精准，不能一刀切地全放过，
    // 否则该做的 `_a_` 改写也会丢。
    expect(await transform('<view class="p-2.5">const a = true ? 1 : 0'))
      .toMatchInlineSnapshot(`"<view class="p-2_dot_5">const a = true ? 1 : 0"`)
    // `where` 是同一条规则的另一个匹配，也必须原样通过。
    expect(await transform('const x = where ? 1 : 0'))
      .toMatchInlineSnapshot(`"const x = where ? 1 : 0"`)
  })
})
