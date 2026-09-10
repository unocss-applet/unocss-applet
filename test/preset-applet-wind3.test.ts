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

  // #99 的回归测试：wind3 preflight 的 CSS 变量默认值必须作用在 `:not(not)` 上，
  // 不能用通用选择器（`*`）或 `page`——小程序 wxss 写不出来，而且 `*` 会把
  // transform-origin 变量泄漏给子元素。
  // @see https://github.com/unocss-applet/unocss-applet/issues/99
  it('preflight uses :not(not) instead of universal/page selector (#99)', async () => {
    const { css } = await uno.generate('translate-x-4', { preflights: true })

    expect(css).toContain(':not(not)')
    // 光秃秃的通用选择器（`*{`、`*,`、`,*`，或包在 `@supports{*` 里）永远不是小程序
    // 安全的；`[{,}]` 锚点同时能抓到 @supports 块的形态
    expect(css).not.toMatch(/(^|[{,}])\s*\*\s*[,{]/)
    expect(css).not.toMatch(/(^|[{,}])\s*page\s*[,{]/)
  })

  // #106 的回归测试：三种 `important` 写法都要在不含字面 `!` 的选择器下产出
  // `!important`（小程序 wxss 拒绝 `!`），且每个都有独立的小程序安全别名，和
  // `transformerApplet` 写进源码的名字一一对应。
  // @see https://github.com/unocss-applet/unocss-applet/issues/106
  it('emits !important under applet-safe selectors for every important spelling (#106)', async () => {
    const { css } = await uno.generate('!font-bold font-bold! important:font-bold', { preflights: false })

    // `!important` 声明本身必须落地
    expect(css).toMatch(/font-weight:700 !important/)
    // 选择器里必须是小程序安全的别名，不能出现字面 `!`
    expect(css).toContain('._a_font-bold')
    expect(css).toContain('.font-bold_a_')
    expect(css).toContain('.important_a_font-bold')
    // 任何还带着原始 `!` 的选择器在小程序端都是非法的
    expect(css).not.toMatch(/\.[\w-]*!/)
  })
})
