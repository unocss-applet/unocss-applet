import { presetApplet } from '@unocss-applet/preset-applet'
import { createGenerator } from '@unocss/core'
import { describe, expect, it } from 'vitest'
import { presetExtras, targets, targets2, targetsWithThemes } from './assets/preset-wind3-targets'

const uno = await createGenerator({
  presets: [
    presetApplet({
      presetOptions: {
        dark: 'media',
      },
      unsupportedChars: ['~', ' '],
    }),
  ],
  theme: {
    colors: {
      custom: {
        a: 'var(--custom)',
        b: 'rgba(var(--custom), %alpha)',
        c: 'rgba(var(--custom-c) / %alpha)',
        d: 'hsl(var(--custom-d), %alpha)',
        e: 'hsl(var(--custom-e) / <alpha-value>)',
        f: 'lch(var(--custom-f) / <alpha-value>)',
      },
      info: 'hsl(200.1, 100%, 54.3%)',
    },
  },
  shortcuts: {
    'u-text-color': 'text-[#323233] dark:text-[#F5F5F5]',
    'u-text-color/2': 'text-[#969799] dark:text-[#707070]',
  },
})

describe('preset-applet-wind3', () => {
  it('targets', async () => {
    const code = [
      ...targets,
      ...targetsWithThemes,
    ].join(' ')
    const { css } = await uno.generate(code, { preflights: false })
    const { css: css2 } = await uno.generate(code, { preflights: false })

    await expect(css).toMatchFileSnapshot('./assets/output/preset-wind3-targets.css')
    expect(css).toEqual(css2)
  })

  it('targets2', async () => {
    const code = targets2.join(' ')
    const { css } = await uno.generate(code, { preflights: false })
    const { css: css2 } = await uno.generate(code, { preflights: false })

    await expect(css).toMatchFileSnapshot('./assets/output/preset-wind3-targets-2.css')
    expect(css).toEqual(css2)
  })

  it('preset extras', async () => {
    const code = presetExtras.join(' ')
    const { css } = await uno.generate(code, { preflights: false })

    await expect(css).toMatchFileSnapshot('./assets/output/preset-wind3-preset-extras.css')
  })

  // Regression for #99: wind3 preflight must scope its CSS-variable defaults to
  // `:not(not)` instead of a universal selector (`*`) or `page`, which applet wxss
  // cannot express and which leaks transform-origin vars into children.
  // @see https://github.com/unocss-applet/unocss-applet/issues/99
  it('preflight uses :not(not) instead of universal/page selector (#99)', async () => {
    const { css } = await uno.generate('translate-x-4', { preflights: true })

    expect(css).toContain(':not(not)')
    // a bare universal selector (`*{`, `*,`, `,*`, or wrapped in `@supports{*`)
    // is never applet-safe; the `[{,}]` anchor also catches the @supports-block form
    expect(css).not.toMatch(/(^|[{,}])\s*\*\s*[,{]/)
    expect(css).not.toMatch(/(^|[{,}])\s*page\s*[,{]/)
  })

  // Regression for #106: the three `important` spellings must emit `!important` under a
  // selector with no literal `!` (applet wxss rejects it), each with a distinct applet-safe
  // alias matching what `transformerApplet` writes into the source.
  // @see https://github.com/unocss-applet/unocss-applet/issues/106
  it('emits !important under applet-safe selectors for every important spelling (#106)', async () => {
    const { css } = await uno.generate('!font-bold font-bold! important:font-bold', { preflights: false })

    // the `!important` declarations themselves must land
    expect(css).toMatch(/font-weight:700 !important/)
    // and the selectors must contain the applet-safe aliases, never a literal `!`
    expect(css).toContain('._a_font-bold')
    expect(css).toContain('.font-bold_a_')
    expect(css).toContain('.important_a_font-bold')
    // any selector still holding a raw `!` would be applet-invalid
    expect(css).not.toMatch(/\.[\w-]*!/)
  })
})
