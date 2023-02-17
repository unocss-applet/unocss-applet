import { createGenerator } from '@unocss/core'
import { describe, expect, test } from 'vitest'
import presetRpxToRem from '@unocss-applet/preset-rpx-to-rem'
import presetMini from '@unocss/preset-mini'

describe('rpx-to-rem', () => {
  const unoRpxToRem = createGenerator({
    presets: [
      presetMini(),
      presetRpxToRem({
        baseFontSize: 16,
        screenWidth: 375,
      }),
    ],
  })

  test('should work', async () => {
    expect((await unoRpxToRem.generate(
      new Set(['m-32rpx', 'mx-16rpx', '-p-2prx', 'gap-2rpx']),
      { preflights: false })).css)
      .toMatchInlineSnapshot(`
        "/* layer: default */
        .m-32rpx{margin:1rem;}
        .mx-16rpx{margin-left:0.5rem;margin-right:0.5rem;}
        .gap-2rpx{grid-gap:0.0625rem;gap:0.0625rem;}"
      `)
  })
})
