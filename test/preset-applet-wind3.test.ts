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
})
