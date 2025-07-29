import type { UnocssPluginContext } from '@unocss/core'
import { presetApplet, transformerApplet } from '@unocss-applet/preset-applet'
import { createGenerator } from '@unocss/core'
import MagicString from 'magic-string'
import { describe, expect, it } from 'vitest'

const transformer = transformerApplet()

describe('transformer-applet', async () => {
  const uno = await createGenerator({
    presets: [
      presetApplet({
        presetOptions: {
          dark: 'media',
        },
        unsupportedChars: ['~', ' '],
      }),
    ],
  })

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
