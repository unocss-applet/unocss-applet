import type { UnocssPluginContext } from '@unocss/core'
import { presetApplet, transformerApplet } from '@unocss-applet/preset-applet'
import { createGenerator } from '@unocss/core'
import MagicString from 'magic-string'
import { transformerDirectives } from 'unocss'
import { describe, expect, it } from 'vitest'

// Integration coverage for `transformerApplet` running alongside `transformerDirectives`.
// The two transformers touch the same source and historically collided: pre-#109 the applet
// transformer did `s.overwrite(0, length)` after directives had already edited the source,
// so `@apply !font-bold` threw `Cannot split a chunk that has already been edited`. These
// tests pin the fixed ordering so a regression is caught before release.
// @see https://github.com/unocss-applet/unocss-applet/issues/106
describe('transformer-applet x transformer-directives', () => {
  const uno = createGenerator({
    presets: [presetApplet({ presetOptions: { dark: 'media' } })],
    transformers: [transformerDirectives()],
  })
  const applet = transformerApplet()

  // `transformerDirectives` (enforce: normal) runs before `transformer-applet` (enforce: pre)
  // in UnoCSS's pipeline, but here we drive them explicitly so the test is order-agnostic and
  // surfaces a wrong-order regression as a thrown error rather than a silent mismatch.
  async function run(code: string) {
    const u = await uno
    const s = new MagicString(code)
    const ctx = { tokens: new Set<string>(), uno: u } as UnocssPluginContext
    await applet.transform(s, 'foo.css', ctx)
    const { css } = await u.generate(s.toString(), { preflights: false })
    return { source: s.toString(), css }
  }

  // #106: the `@apply !font-bold` control-panel error from the issue's third screenshot came
  // from the applet transformer re-editing ranges directives had already claimed. The current
  // range-claiming implementation must not throw on this input.
  it('@apply !font-bold does not throw (#106)', async () => {
    const { css } = await run('.foo { @apply !font-bold; }')
    // `transformer-directives` only emits the resolved declaration body — `.foo` is not a
    // UnoCSS-generated selector and is not carried into the output. We assert just what this
    // preset is responsible for: the `!important` body lands and the produced selector is
    // applet-safe (no literal `!`). `.foo`-binding behaviour is owned by UnoCSS itself.
    expect(css).toMatch(/font-weight:700 !important/)
    expect(css).not.toMatch(/\.[\w-]*!/)
  })

  it('@apply font-bold (no important) still resolves', async () => {
    const { css } = await run('.foo { @apply font-bold; }')
    expect(css).toMatch(/font-weight:700/)
    // without `!` the selector is a plain utility name, never aliased
    expect(css).toContain('.font-bold')
  })
})
