import { createGenerator } from '@unocss/core'
import { describe, expect, test } from 'vitest'
import presetRemRpx from '@unocss-applet/preset-rem-rpx'
import presetMini from '@unocss/preset-mini'

describe('rem-rpx', () => {
  const unoRemToRpx = createGenerator({
    presets: [
      presetMini(),
      presetRemRpx({
        baseFontSize: 16,
        screenWidth: 375,
        mode: 'rem2rpx',
      }),
    ],
  })

  const unoRpxToRem = createGenerator({
    presets: [
      presetMini(),
      presetRemRpx({
        baseFontSize: 16,
        screenWidth: 375,
        mode: 'rpx2rem',
      }),
    ],
  })

  test('should rem to rpx', async () => {
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

  test('should rpx to rem', async () => {
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
