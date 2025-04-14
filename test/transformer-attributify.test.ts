import type { SourceCodeTransformer } from '@unocss/core'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import transformerAttributify from '@unocss-applet/transformer-attributify'
import { createGenerator } from '@unocss/core'
import { presetAttributify } from '@unocss/preset-attributify'
import { presetIcons } from '@unocss/preset-icons'
import { presetWind3 } from '@unocss/preset-wind3'
import MagicString from 'magic-string'
import { describe, expect, it } from 'vitest'

async function transform(code: string, transformer: SourceCodeTransformer) {
  const s = new MagicString(code)

  const uno = await createGenerator({
    presets: [
      presetWind3(),
      presetIcons({
        scale: 1.2,
        cdn: 'https://esm.sh/',
      }),
      presetAttributify(),
    ],
    transformers: [
      transformer,
    ],
  })
  await transformer.transform(s, 'foo.vue', { uno, tokens: new Set() } as any)
  return s.toString()
}

describe('transformer-attributify', async () => {
  const content = await fs.readFile(
    path.resolve(__dirname, './fixtures/attributify.vue'),
  )

  it('basic', async () => {
    const transformer = transformerAttributify({ ignoreAttributes: ['block'] })
    const result = await transform(content.toString(), transformer)
    expect(result).toMatchSnapshot()
  })

  it('prefixedOnly', async () => {
    const transformer = transformerAttributify({ prefixedOnly: true })
    const result = await transform(content.toString(), transformer)
    expect(result).toMatchSnapshot()
  })
})
