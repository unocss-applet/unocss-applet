import { promises as fs } from 'fs'
import path from 'path'
import { describe, expect, test } from 'vitest'
import type { SourceCodeTransformer } from '@unocss/core'
import { createGenerator } from '@unocss/core'
import MagicString from 'magic-string'
import transformerAttributify from '@unocss-applet/transformer-attributify'
import presetUno from '@unocss/preset-uno'

describe('transformer-attributify', async () => {
  const content = await fs.readFile(
    path.resolve(__dirname, './fixtures/attributify.vue'),
  )

  async function transform(code: string, transformer: SourceCodeTransformer) {
    const s = new MagicString(code)

    const uno = createGenerator({
      presets: [
        presetUno(),
      ],
      transformers: [
        transformer,
      ],
    })
    await transformer.transform(s, 'foo.js', { uno, tokens: new Set() } as any)
    const result = s.toString()
    const { css } = await uno.generate(result, { preflights: false })
    return {
      code: result,
      css,
    }
  }

  test('basic', async () => {
    const transformer = transformerAttributify()
    const result = await transform(content.toString(), transformer)
    expect(result).toMatchSnapshot()
  })

  test('prefixedOnly', async () => {
    const transformer = transformerAttributify({ prefixedOnly: true })
    const result = await transform(content.toString(), transformer)
    expect(result).toMatchSnapshot()
  })
})
