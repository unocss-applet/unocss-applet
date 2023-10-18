import { createGenerator } from '@unocss/core'
import presetApplet from '@unocss-applet/preset-applet'
import { describe, expect, it } from 'vitest'
import { presetExtra } from 'unocss-preset-extra'

const targets = [
  // base
  'p-2',
  'p-2.5',
  'p-2.5rem',
  'p-2.5px',
  'p-2.5em',

  // variants - mix
  'mix-tint-50-c-red-400',
  'mix-shade-50-c-red-400',
  'mix-shift-50-c-red-600',
  'mix-shift--50-c-red-600',

  // custom colors
  'text-custom-a',
  'bg-custom-b',
  'bg-info',
  'bg-info/10',
  'bg-info/[10%]',
  'border-custom-b',
  'border-custom-b/0',
  'border-custom-b/10',
  'bg-custom-c',
  'bg-custom-c/10',
  'bg-custom-d',
  'bg-custom-d/20',
  'bg-custom-e',
  'bg-custom-e/30',
  'bg-custom-f',
  'bg-custom-f/30',
  'bg-custom-f/[var(--f-op)]',

  // wind - placeholder
  'placeholder-red-400',
  'placeholder-inherit',
  'placeholder-opacity-10',
  'placeholder-op90',

  // wind - variants custom media (themed)
  'media-opacity_not_ok:opacity-0',
  'media-touch:p-4',

  // mini + wind - placeholder
  'focus:placeholder-red-300',
  'hover:placeholder-op90',

  // space
  'space-y-none',
  'space-x-2',
  'space-y-4',
  'space-x-reverse',
  'space-x-$space',
  'space-inline-2',
  'space-block-4',
  'space-block-none',
  'space-inline-reverse',
  'space-inline-$space',

  // divide
  'divide',
  'divide-y-4',
  'divide-x-4',
  'divide-x-reverse',
  'divide-block-4',
  'divide-inline-4',
  'divide-inline-reverse',
  'divide-green-500',
  'divide-opacity-50',
  'divide-dashed',
  'divide-dotted',
  'divide-ridge',
  'divide-transparent',
  'divide-current',
  'divide-none',
  'divide-x-none',
  'divide-inline-none',
]

const targets2 = [
  // mini - variants selector
  'selector-[section]:c-gray-400',
  'selector-[.cls.multi]:c-gray-400',
  'md:selector-[aside]:shadow-xl',
  'dark:selector-[.body_main]:bg-white',
]

const nonTargets = [
  '--p-2',
  'hi',
  'row-{row.id}',
  'tabs',
  'tab.hello',
  'text-anything',
  'p-anything',
  'rotate-[3]deg',
  'list-none-inside',

  // mini - color utility
  'color-gray-100-prefix/10',
  'color-gray-400-prefix',
  'color-blue-gray-400-prefix',
  'color-true-gray-400-prefix',
  'color-gray-400-500',
  'color-true-gray-400-500',

  // mini - behaviors
  'will-change-all',
  'will-change-none',
  'will-change-margins,padding',
  'will-change-padding,margins',

  // mini - filters
  'brightness',
  'hue-rotate',
  'saturate',
  'backdrop-brightness',
  'backdrop-hue-rotate',
  'backdrop-saturate',

  // mini - ring
  'ring-',

  // mini - shadow
  'shadow-',

  // mini - transition
  'property-colour',
  'property-background-color,colour-300',
  'property-colour-background-color-300',
  'transition-colour',
  'transition-background-color,colour-300',
  'transition-colour,background-color-300',

  // mini - typography
  'tab-',

  // mini - variable
  'tab-$',
  'ws-$',

  // mini - pseudo colon only
  'backdrop-shadow-green',

  // wind - placeholder
  '$-placeholder-red-200',

  // wind - bg-blend
  'bg-blend-plus-lighter', // only added in mix-blend
]

const presetExtras = [
  'size-0',
  'size-1',
  'size-2',
  'size-0.5',
  'size-1.5',
  'size-1/2',
  'size-auto',
  'size-sm',
  'size-prose',
  'size-screen',
  'size-full',

  'min-size-0',
  'min-size-1',
  'min-size-2',
  'min-size-0.5',
  'min-size-1.5',
  'min-size-1/2',
  'min-size-auto',
  'min-size-sm',
  'min-size-prose',
  'min-size-screen',
  'min-size-full',

  'max-size-0',
  'max-size-1',
  'max-size-2',
  'max-size-0.5',
  'max-size-1.5',
  'max-size-1/2',
  'max-size-auto',
  'max-size-sm',
  'max-size-prose',
  'max-size-screen',
  'max-size-full',

  '[size~="\\30 20"]',
]

const uno = createGenerator({
  presets: [
    presetApplet({
      dark: 'media',
      unsupportedChars: ['~', ' '],
    }),
    presetExtra(),
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
})

describe('preset-applet', () => {
  it('targets', async () => {
    const code = targets.join(' ')
    const { css } = await uno.generate(code, { preflights: false })
    const { css: css2 } = await uno.generate(code, { preflights: false })

    expect(css).toMatchSnapshot()
    expect(css).toEqual(css2)
  })

  it('targets2', async () => {
    const code = targets2.join(' ')
    const { css } = await uno.generate(code, { preflights: false })
    const { css: css2 } = await uno.generate(code, { preflights: false })

    expect(css).toMatchSnapshot()
    expect(css).toEqual(css2)
  })

  it('non-targets', async () => {
    const code = nonTargets.join(' ')
    const { css, matched } = await uno.generate(code, { preflights: false })

    expect(Array.from(matched)).toEqual([])
    expect(css).toBe('')
  })

  it('preset extras', async () => {
    const code = presetExtras.join(' ')
    const { css } = await uno.generate(code, { preflights: false })

    expect(css).toMatchSnapshot()
  })
})
