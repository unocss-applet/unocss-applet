import { presetRemRpx } from '@unocss-applet/preset-rem-rpx'
import { createGenerator } from '@unocss/core'
import { presetWind3 } from '@unocss/preset-wind3'
import { describe, expect, it } from 'vitest'

const unoRemToRpx = await createGenerator({
  presets: [
    presetWind3(),
    presetRemRpx({
      baseFontSize: 16,
      screenWidth: 375,
      mode: 'rem2rpx',
    }),
  ],
})

const unoRpxToRem = await createGenerator({
  presets: [
    presetWind3(),
    presetRemRpx({
      baseFontSize: 16,
      screenWidth: 375,
      mode: 'rpx2rem',
    }),
  ],
})

const rem2rpxTargets = [
  'm4',
  'm--4',
  'mx2',
  '-p2',
  'gap2',
  'space-x-4',
  'space-x--4',
  '-space-x-4',
  'divide-x-4',
  'divide-x-1rem',
]

const rpx2remTargets = [
  'm-32rpx',
  'm--32rpx',
  'mx-16rpx',
  '-p-2prx',
  'gap-2rpx',
  'space-x-32rpx',
  'space-x--32rpx',
  '-space-x-32rpx',
  'divide-x-32rpx',
]

describe('rem-rpx', () => {
  it('should rem to rpx', async () => {
    expect((await unoRemToRpx.generate(rem2rpxTargets, { preflights: false })).css)
      .toMatchInlineSnapshot(`
        "/* layer: default */
        .m--4{margin:-32rpx;}
        .m4{margin:32rpx;}
        .mx2{margin-left:16rpx;margin-right:16rpx;}
        .gap2{gap:16rpx;}
        .-space-x-4>:not([hidden])~:not([hidden]){--un-space-x-reverse:0;margin-left:calc(calc(32rpx * calc(1 - var(--un-space-x-reverse))) * -1);margin-right:calc(calc(32rpx * var(--un-space-x-reverse)) * -1);}
        .space-x--4>:not([hidden])~:not([hidden]){--un-space-x-reverse:0;margin-left:calc(-32rpx * calc(1 - var(--un-space-x-reverse)));margin-right:calc(-32rpx * var(--un-space-x-reverse));}
        .space-x-4>:not([hidden])~:not([hidden]){--un-space-x-reverse:0;margin-left:calc(32rpx * calc(1 - var(--un-space-x-reverse)));margin-right:calc(32rpx * var(--un-space-x-reverse));}
        .divide-x-1rem>:not([hidden])~:not([hidden]){--un-divide-x-reverse:0;border-left-width:calc(32rpx * calc(1 - var(--un-divide-x-reverse)));border-right-width:calc(32rpx * var(--un-divide-x-reverse));}
        .divide-x-4>:not([hidden])~:not([hidden]){--un-divide-x-reverse:0;border-left-width:calc(4px * calc(1 - var(--un-divide-x-reverse)));border-right-width:calc(4px * var(--un-divide-x-reverse));}
        .-p2{padding:-16rpx;}"
      `)
  })

  it('should rpx to rem', async () => {
    expect((await unoRpxToRem.generate(rpx2remTargets, { preflights: false })).css)
      .toMatchInlineSnapshot(`
        "/* layer: default */
        .m--32rpx{margin:-1rem;}
        .m-32rpx{margin:1rem;}
        .mx-16rpx{margin-left:0.5rem;margin-right:0.5rem;}
        .gap-2rpx{gap:0.0625rem;}
        .-space-x-32rpx>:not([hidden])~:not([hidden]){--un-space-x-reverse:0;margin-left:calc(calc(1rem * calc(1 - var(--un-space-x-reverse))) * -1);margin-right:calc(calc(1rem * var(--un-space-x-reverse)) * -1);}
        .space-x--32rpx>:not([hidden])~:not([hidden]){--un-space-x-reverse:0;margin-left:calc(-1rem * calc(1 - var(--un-space-x-reverse)));margin-right:calc(-1rem * var(--un-space-x-reverse));}
        .space-x-32rpx>:not([hidden])~:not([hidden]){--un-space-x-reverse:0;margin-left:calc(1rem * calc(1 - var(--un-space-x-reverse)));margin-right:calc(1rem * var(--un-space-x-reverse));}
        .divide-x-32rpx>:not([hidden])~:not([hidden]){--un-divide-x-reverse:0;border-left-width:calc(1rem * calc(1 - var(--un-divide-x-reverse)));border-right-width:calc(1rem * var(--un-divide-x-reverse));}"
      `)
  })
})
