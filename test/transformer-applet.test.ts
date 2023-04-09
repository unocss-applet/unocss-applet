import { promises as fs } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import type { UnoGenerator } from '@unocss/core'
import { createGenerator } from '@unocss/core'
import MagicString from 'magic-string'
import transformerAttributify from '@unocss-applet/transformer-attributify'
import transformerApplet from '@unocss-applet/transformer-applet'
import { presetAttributify, transformerDirectives, transformerVariantGroup } from 'unocss'
import { presetApplet } from 'unocss-applet'
import { presetExtra } from 'unocss-preset-extra'

describe('transformer-applet', () => {
  const uno = createGenerator({
    presets: [
      presetApplet(),
      presetExtra(),
      presetAttributify(),
    ],
    transformers: [
      transformerDirectives(),
      transformerVariantGroup(),
    ],
  })
  const _transformerAttributify = transformerAttributify({ ignoreAttributes: ['block'] })
  const _transformerApplet = transformerApplet()

  async function transform(code: string, _uno: UnoGenerator = uno) {
    const s = new MagicString(code)
    const { css } = await uno.generate(code, { preflights: false })

    await _transformerAttributify.transform(s, 'foo.js', { uno: _uno, tokens: new Set() } as any)
    await _transformerApplet.transform(s, 'foo.js', { uno: _uno, tokens: new Set() } as any)
    const result = s.toString()
    return {
      code: result,
      css,
    }
  }

  test('basic', async () => {
    const content = await fs.readFile(
      path.resolve(__dirname, './fixtures/rules.vue'),
    )
    const result = await transform(content.toString())
    expect(result).toMatchSnapshot()
  })
})
