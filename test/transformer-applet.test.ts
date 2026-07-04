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
    expect(result).toMatchInlineSnapshot(`"-ml-1_a_5 ml-1_a_5 -mt-2 bg-_a_url_a_https_a__a__a_api_a_iconify_a_design_a_carbon_a_bat_a_svg_a_color_a_red_a__a_"`)
  })

  // #109: the previous `code.replaceAll(replace, replaced)` matched any substring,
  // so `p-2.5` would also corrupt the `.5` inside `p-2.55`. The boundary regex
  // (lookahead `(?![A-Za-z0-9_])`) must rewrite each decimal utility wholesale.
  it('decimal scale: no partial match into a longer sibling (#109)', async () => {
    expect(await transform('p-2.5 p-2.55 p-2.5')).toMatchInlineSnapshot(`"p-2_a_5 p-2_a_55 p-2_a_5"`)
    expect(await transform('text-2.5 text-2.55')).toMatchInlineSnapshot(`"text-2_a_5 text-2_a_55"`)
  })

  // a variant-prefixed utility (`dark:p-2.5`) and the bare utility nested inside it
  // (`p-2.5`) both land in `matched`. Longest-first sorting + range claiming lets the
  // outer token own its full span; otherwise the template would keep an applet-invalid
  // class like `dark:p-2_a_5` (the `:` never gets aliased).
  it('variant prefix overlapping a nested utility', async () => {
    expect(await transform('dark:p-2.5 p-2.5')).toMatchInlineSnapshot(`"dark_a_p-2_a_5 p-2_a_5"`)
    expect(await transform('hover:bg-[#fff]')).toMatchInlineSnapshot(`"hover_a_bg-_a__a_fff_a_"`)
  })

  // utilities inside class attrs and dynamic bindings must be rewritten — on applets the
  // class name in the template has to match the `_a_`-aliased selector in wxss. The string
  // literal in `:class` is intentional here, not a bug to avoid.
  it('rewrites utilities in static class and dynamic template literal', async () => {
    expect(await transform('<view class="p-2.5 m-1.5" />')).toMatchInlineSnapshot(`"<view class=\"p-2_a_5 m-1_a_5\" />"`)
    // eslint-disable-next-line no-template-curly-in-string -- literal `${x}` is the fixture under test
    expect(await transform(':class="`p-2.5 ${x}`"')).toMatchInlineSnapshot(`":class=\"\`p-2_a_5 \${x}\`\""`)
  })

  // the lookahead/lookbehind boundaries: `x-p-2.5` and `p-2.5x` are not UnoCSS utilities,
  // so they are absent from `matched` and must pass through untouched.
  it('leaves non-utility neighbours untouched', async () => {
    expect(await transform('x-p-2.5')).toMatchInlineSnapshot(`"x-p-2.5"`)
    expect(await transform('p-2.5x')).toMatchInlineSnapshot(`"p-2.5x"`)
  })

  it('mixed utility list', async () => {
    expect(await transform('text-red p-2.5 m-2 hover:bg-blue-100')).toMatchInlineSnapshot(`"text-red p-2_a_5 m-2 hover_a_bg-blue-100"`)
  })

  // #109 problem 2: on a bare-text template the extractor pulls in tokens with HTML tag
  // chars bleed-through (e.g. `translate--1/2</text>`). Aliasing those corrupts the source,
  // so tokens containing `<`/`>` are rejected; `</text>` is preserved verbatim and the two
  // real utilities still get aliased.
  it('rejects tokens with HTML tag bleed-through (#109 problem 2)', async () => {
    expect(await transform('<text>absolute top-1/2 left-1/2 translate--1/2</text>')).toMatchInlineSnapshot(`"<text>absolute top-1_a_2 left-1_a_2 translate--1/2</text>"`)
  })

  // #109 problem 1: utilities inside comments must be left alone, while the same utility in
  // the adjacent class attr is still rewritten. Block (`/* */`) and HTML (`<!-- -->`) comments
  // are matched; `//` line comments are intentionally NOT matched because the `//` in URLs is
  // indistinguishable from a real line comment to a stateless regex (see transformers.ts).
  it('skips utilities inside block and HTML comments (#109 problem 1)', async () => {
    expect(await transform('<!-- p-2.5 note --><view class="p-2.5" />')).toMatchInlineSnapshot(`"<!-- p-2.5 note --><view class=\"p-2_a_5\" />"`)
    expect(await transform('/* see p-2.5 */ <view class="p-2.5" />')).toMatchInlineSnapshot(`"/* see p-2.5 */ <view class=\"p-2_a_5\" />"`)
  })

  // `!` (important) is aliased like any other unsupported char and must NOT be dropped by the
  // #109 problem-2 filter — `<`/`>` rejection must be precise, not over-broad.
  it('keeps important-flag utilities through the #109 filter', async () => {
    expect(await transform('bg-red! p-2.5!')).toMatchInlineSnapshot(`"bg-red_a_ p-2_a_5_a_"`)
  })

  // #108: the default extractor splits a ternary so a bare `?` becomes its own token. The
  // built-in `questionMark` rule (matching `/^(where|\?)$/`) would treat `?` as a utility,
  // landing it in `matched`; since `?` is an unsupported char the transformer rewrites it to
  // `_a_`, corrupting the ternary into `true _a_ 1 : 0`. `presetApplet` drops that rule, so `?`
  // never reaches the transformer and script stays intact. `where` (also matched by that rule)
  // is covered by the same fix.
  it('does not rewrite the ternary `?` in script (#108)', async () => {
    expect(await transform('onLaunch(() => { const a = true ? 1 : 0 })'))
      .toMatchInlineSnapshot(`"onLaunch(() => { const a = true ? 1 : 0 })"`)
    // a real utility in the same source still gets aliased — the fix must be surgical, not a
    // blanket pass-through that would also drop legitimate `_a_` rewrites.
    expect(await transform('<view class="p-2.5">const a = true ? 1 : 0'))
      .toMatchInlineSnapshot(`"<view class=\"p-2_a_5\">const a = true ? 1 : 0"`)
    // `where` is the rule's other match; it must also pass through untouched.
    expect(await transform('const x = where ? 1 : 0'))
      .toMatchInlineSnapshot(`"const x = where ? 1 : 0"`)
  })
})
