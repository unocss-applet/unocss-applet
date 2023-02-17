import { createGenerator } from '@unocss/core'
import { describe, expect, test } from 'vitest'
import presetRemToRpx from '@unocss-applet/preset-rem-to-rpx'
import presetMini from '@unocss/preset-mini'

describe('rem-to-rpx', () => {
  const unoRemToRpx = createGenerator({
    presets: [
      presetMini(),
      presetRemToRpx({
        baseFontSize: 16,
        screenWidth: 375,
      }),
    ],
  })

  test('should work', async () => {
    expect((await unoRemToRpx.generate(
      new Set(['m4', 'mx2', '-p2', 'gap2']),
      { preflights: false })).css)
      .toMatchInlineSnapshot(`
        "/* layer: default */
        .-p2{padding:-16rpx;}
        .m4{margin:32rpx;}
        .mx2{margin-left:16rpx;margin-right:16rpx;}
        .gap2{grid-gap:16rpx;gap:16rpx;}"
      `)
  })
})
