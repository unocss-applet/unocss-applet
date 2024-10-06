import { promises as fs } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { SourceCodeTransformer } from '@unocss/core'
import { createGenerator } from '@unocss/core'
import MagicString from 'magic-string'
import transformerAttributify from '@unocss-applet/transformer-attributify'
import presetUno from '@unocss/preset-uno'
import { presetAttributify, presetIcons } from 'unocss'
import { presetExtra } from 'unocss-preset-extra'

async function transform(code: string, transformer: SourceCodeTransformer) {
  const s = new MagicString(code)

  const uno = createGenerator({
    presets: [
      presetUno(),
      presetIcons({
        scale: 1.2,
        cdn: 'https://esm.sh/',
      }),
      presetAttributify(),
      presetExtra(),
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
