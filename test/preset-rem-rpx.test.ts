import { createGenerator } from '@unocss/core'
import { describe, expect, it } from 'vitest'
import presetRemRpx from '@unocss-applet/preset-rem-rpx'
import presetUno from '@unocss/preset-uno'

describe('rem-rpx', () => {
  const unoRemToRpx = createGenerator({
    presets: [
      presetUno(),
      presetRemRpx({
        baseFontSize: 16,
        screenWidth: 375,
        mode: 'rem2rpx',
      }),
    ],
  })

  const unoRpxToRem = createGenerator({
    presets: [
      presetUno(),
      presetRemRpx({
        baseFontSize: 16,
        screenWidth: 375,
        mode: 'rpx2rem',
      }),
    ],
  })

  it('should rem to rpx', async () => {
    expect((await unoRemToRpx.generate(
      new Set(['m4', 'mx2', '-p2', 'gap2', 'space-x-4']),
      { preflights: false },
    )).css)
      .toMatchInlineSnapshot(`
        "/* layer: default */
        .m4{margin:32rpx;}
        .mx2{margin-left:16rpx;margin-right:16rpx;}
        .gap2{gap:16rpx;}
        .space-x-4>:not([hidden])~:not([hidden]){--un-space-x-reverse:0;margin-left:calc(32rpx * calc(1 - var(--un-space-x-reverse)));margin-right:calc(32rpx * var(--un-space-x-reverse));}
        .-p2{padding:-16rpx;}"
      `)
  })

  it('should rpx to rem', async () => {
    expect((await unoRpxToRem.generate(
      new Set(['m-32rpx', 'mx-16rpx', '-p-2prx', 'gap-2rpx', 'space-x-32rpx']),
      { preflights: false },
    )).css)
      .toMatchInlineSnapshot(`
        "/* layer: default */
        .m-32rpx{margin:1rem;}
        .mx-16rpx{margin-left:0.5rem;margin-right:0.5rem;}
        .gap-2rpx{gap:0.0625rem;}
        .space-x-32rpx>:not([hidden])~:not([hidden]){--un-space-x-reverse:0;margin-left:calc(1rem * calc(1 - var(--un-space-x-reverse)));margin-right:calc(1rem * var(--un-space-x-reverse));}"
      `)
  })
})
