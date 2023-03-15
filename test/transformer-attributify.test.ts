import { promises as fs } from 'fs'
import path from 'path'
import { describe, expect, test } from 'vitest'
import type { SourceCodeTransformer } from '@unocss/core'
import { createGenerator } from '@unocss/core'
import MagicString from 'magic-string'
import transformerAttributify from '@unocss-applet/transformer-attributify'
import presetUno from '@unocss/preset-uno'
import { presetIcons } from 'unocss'

describe('transformer-attributify', async () => {
  const content = await fs.readFile(
    path.resolve(__dirname, './fixtures/attributify.vue'),
  )

  async function transform(code: string, transformer: SourceCodeTransformer) {
    const s = new MagicString(code)

    const uno = createGenerator({
      presets: [
        presetUno(),
        presetIcons({
          scale: 1.2,
          cdn: 'https://esm.sh/',
        }),
      ],
      transformers: [
        transformer,
      ],
    })
    await transformer.transform(s, 'foo.js', { uno, tokens: new Set() } as any)
    return s.toString()
  }

  test('basic', async () => {
    const transformer = transformerAttributify({ ignoreAttributes: ['block'] })
    const result = await transform(content.toString(), transformer)
    expect(result).toMatchInlineSnapshot(`
      "<script setup lang=\\"ts\\">
      import { ref } from 'vue'
      const bool = ref<boolean>()
      const c = 'text-red'
      </script>

      <template>
        <div class=\\"text-center aaa p-2.5 text-blue\\" :class=\\"c\\">
          <div  class=\\"text-4xl text-green p-2 ma\\"/>
          <div :class=\\"\`p-2.5 \${bool ? 'p-0.5' : ''}\`\\" :hover-class=\\"['!bg-green']\\"  class=\\"m-2\\"/>
          <div class=\\"p-1 flex flex-col flex-gap-1 items-center\\" />
          <div class=\\"b b-green text-right h-10 !text-pink\\">
            123456789
          </div>
          <div class=\\"text-purple b b-green\\">
            123456789
          </div>
          <div  class=\\"i-carbon:logo-twitter dark:i-carbon:logo-github\\"/>
          <div  class=\\"i-carbon-logo-twitter dark:i-carbon-logo-github mt-2.5\\"/>
          <div class=\\"[&>div]:w-10 text-red\\">
            <div block class=\\"text-left\\">
              1
            </div>
            <div class=\\"text-center\\">
              2
            </div>
            <div class=\\"text-right\\">
              3
            </div>
          </div>
        </div>
      </template>
      "
    `)
  })

  test('prefixedOnly', async () => {
    const transformer = transformerAttributify({ prefixedOnly: true })
    const result = await transform(content.toString(), transformer)
    expect(result).toMatchInlineSnapshot(`
      "<script setup lang=\\"ts\\">
      import { ref } from 'vue'
      const bool = ref<boolean>()
      const c = 'text-red'
      </script>

      <template>
        <div class=\\"text-center aaa\\" p=\\"2.5\\" text-blue :class=\\"c\\">
          <div text=\\"4xl\\" text-green ma  class=\\"p-2\\"/>
          <div :class=\\"\`p-2.5 \${bool ? 'p-0.5' : ''}\`\\" m-2 :hover-class=\\"['!bg-green']\\" />
          <div flex=\\"~ col gap-1\\" class=\\"p-1\\" items-center />
          <div text-right h-10 text=\\"!pink\\" class=\\"b b-green\\">
            123456789
          </div>
          <div class=\\"text-purple b b-green\\">
            123456789
          </div>
          <div i-carbon:logo-twitter dark:i-carbon:logo-github />
          <div i-carbon-logo-twitter dark:i-carbon-logo-github mt-2.5 />
          <div class=\\"[&>div]:w-10\\" text-red>
            <div text-left block>
              1
            </div>
            <div text-center>
              2
            </div>
            <div text-right>
              3
            </div>
          </div>
        </div>
      </template>
      "
    `)
  })
})
