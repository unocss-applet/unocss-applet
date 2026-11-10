import type { UnocssPluginContext } from '@unocss/core'
import { presetApplet } from '@unocss-applet/preset-applet'
import { transformerHover } from '@unocss-applet/transformer-hover'
import { createGenerator } from '@unocss/core'
import MagicString from 'magic-string'
import { describe, expect, it } from 'vitest'

describe.each(['wind3', 'wind4'] as const)('类名编码碰撞：%s', (preset) => {
  it.each([['w-1/2 w-1.2', 'width:50%', 'width:0.3rem'], ['-ml-1/2 -ml-1.2', 'margin-left:-50%', 'margin-left:-0.3rem']])(
    '不同标点的工具类各自保留样式：%s',
    async (classes, fraction, decimal) => {
      const uno = await createGenerator({ presets: [presetApplet({ preset })] })
      const s = new MagicString(`<view class="${classes}" />`)
      const { css: before } = await uno.generate(s.toString(), { preflights: false })
      const ctx = { uno, tokens: new Set<string>() } as UnocssPluginContext
      for (const transformer of uno.config.transformers ?? [])
        await transformer.transform(s, 'collision.vue', ctx)
      const aliases = s.toString().match(/class="([^"]+)"/)![1].split(' ')
      expect(new Set(aliases).size).toBe(2)
      expect(aliases[0]).toContain('_slash_')
      expect(aliases[1]).toContain('_dot_')
      const { css } = await uno.generate(s.toString(), { preflights: false })
      expect(css).toBe(before)
      expect(css).toContain(fraction)
      expect(css).toContain(preset === 'wind3' ? decimal : decimal.replace('-0.3rem', 'calc(var(--spacing) * -1.2)').replace('0.3rem', 'calc(var(--spacing) * 1.2)'))
      for (const alias of aliases)
        expect(css).toContain(`.${alias}{`)
    },
  )

  it('按压态里的分数和小数也保留独立样式', async () => {
    const uno = await createGenerator({ presets: [presetApplet({ preset })], transformers: [transformerHover()] })
    const s = new MagicString('<view class="hover:w-1/2 hover:w-1.2" />')
    const ctx = { uno, tokens: new Set<string>() } as UnocssPluginContext
    for (const transformer of uno.config.transformers ?? [])
      await transformer.transform(s, 'collision.vue', ctx)
    expect(s.toString()).toContain('hover-class="w-1_slash_2 w-1_dot_2"')
    const { css } = await uno.generate(s.toString(), { preflights: false })
    expect(css).toContain('.w-1_slash_2{width:50%;}')
    expect(css).toContain(`.w-1_dot_2{width:${preset === 'wind3' ? '0.3rem' : 'calc(var(--spacing) * 1.2)'};}`)
  })

  it('额外不支持字符的源码和 CSS 编码一致', async () => {
    const uno = await createGenerator({
      presets: [presetApplet({ preset, unsupportedChars: ['~'] })],
      shortcuts: { 'custom~width': 'w-1/2', 'custom.width': 'w-1.2' },
    })
    const s = new MagicString('<view class="custom~width custom.width" />')
    const { css: before } = await uno.generate(s.toString(), { preflights: false })
    const ctx = { uno, tokens: new Set<string>() } as UnocssPluginContext
    for (const transformer of uno.config.transformers ?? [])
      await transformer.transform(s, 'collision.vue', ctx)
    expect(s.toString()).toContain('custom_tilde_width custom_dot_width')
    expect((await uno.generate(s.toString(), { preflights: false })).css).toBe(before)
  })
})
