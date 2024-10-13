import type { UnocssPluginContext } from '@unocss/core'
import { createGenerator } from '@unocss/core'
import presetApplet, { transformerApplet } from '@unocss-applet/preset-applet'
import MagicString from 'magic-string'
import { describe, expect, it } from 'vitest'

const targets = [
  // base
  'p-2',
  'p-2.5',
  'p-2.5rem',
  'p-2.5px',
  'p-2.5em',

  'b-2',
  'b-2.5',
  'b-2.5rem',
  'b-2.5px',
  'b-2.5em',

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

  // media
  'md:divide-y-4',
  'md:bg-red',

  // shortcuts
  'u-text-color',
  'u-text-color/2',
]

const targets2 = [
  // mini - variants selector
  'selector-[section]:c-gray-400',
  'selector-[.cls.multi]:c-gray-400',
  'md:selector-[aside]:shadow-xl',
  'dark:selector-[.body_main]:bg-white',
  '[&_.nut-button]:text-lg',
  '[&_.nut-form-item\\_\\_label]:!text-left',
  '*:p-2',
  'dark:*:p-2',
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

  it('preset extras', async () => {
    const code = presetExtras.join(' ')
    const { css } = await uno.generate(code, { preflights: false })

    expect(css).toMatchSnapshot()
  })
})

const transformer = transformerApplet()

describe('transformer-applet', () => {
  async function transform(code: string) {
    const s = new MagicString(code)
    await transformer.transform(s, '', {
      tokens: new Set<string>(),
      uno,
    } as UnocssPluginContext)
    return s.toString()
  }

  it('basic', async () => {
    const transformTargets = [
      '-ml-1.5 ml-1.5 -mt-2',
      'bg-[url(https://api.iconify.design/carbon:bat.svg?color=red)]',
    ]

    const result = await transform(transformTargets.join(' '))
    expect(result).toMatchInlineSnapshot(`"-ml-1_a_5 ml-1_a_5 -mt-2 bg-_a_url_a_https_a__a__a_api_a_iconify_a_design_a_carbon_a_bat_a_svg_a_color_a_red_a__a_"`)
  })
})
