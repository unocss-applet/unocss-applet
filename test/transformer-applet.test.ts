import { promises as fs } from 'fs'
import path from 'path'
import { describe, expect, test } from 'vitest'
import type { UnoGenerator } from '@unocss/core'
import { createGenerator } from '@unocss/core'
import MagicString from 'magic-string'
import transformerApplet from '@unocss-applet/transformer-applet'
import presetUno from '@unocss/preset-uno'

describe('transformer-applet', () => {
  const uno = createGenerator({
    presets: [
      presetUno(),
    ],
  })
  const transformer = transformerApplet()

  async function transform(code: string, _uno: UnoGenerator = uno) {
    const s = new MagicString(code)
    await transformer.transform(s, 'foo.js', { uno: _uno, tokens: new Set() } as any)
    const result = s.toString()
    const { css } = await uno.generate(result, { preflights: false })
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
    expect(result).toMatchInlineSnapshot(`
      {
        "code": "<script setup lang=\\"ts\\">
      const bg = 'uno-98db2v'
      const index = 1
      const type = 'text'
      const bool = true
      </script>

      <template>
        <div class=\\"flex aaa flex-col justify-center items-center\\">
          <div text=\\"green-500 4xl\\" class=\\"rotate-180 i-carbon-campsite\\" :class=\\"bool ? bg : ''\\" />
          <div class=\\"uno-qwn8dt font-(light mono)\\" h20>
            <div class=\\"uno-144q2o hover:(!bg-gray-400 font-medium)\\">
              0123456789
            </div>
          </div>
          <div class=\\"p-1\\" :class=\\"bool ? 'text-yellow-500' : ''\\">
            {{ \`index\${index + 1}\` }}
          </div>
          <div class=\\"uno-1k8588\\" flex=\\"~ col\\">
            <div w-10 h-10 flex=\\"1\\">
              1
            </div>
            <div w-10 h-10 flex=\\"1\\">
              2
            </div>
          </div>

          <button />
          <div class=\\"uno-tw4biu\\" :class=\\"bool ? '' : 'uno-qju0i9'\\">
            abckefghijklmnopqrstuvwxyz
          </div>
        </div>
      </template>
      ",
        "css": "/* layer: applet_shortcuts */
      .uno-1k8588{grid-template-columns:0.7fr repeat(7,1fr);}
      .uno-tw4biu{margin:0.125rem;padding:0.25rem;font-size:1.5rem;line-height:2rem;}
      .uno-qwn8dt{border-width:1px;border-style:solid;--un-bg-opacity:1;background-color:rgba(191,219,254,var(--un-bg-opacity));background-color:rgba(239,68,68,var(--un-bg-opacity));padding-left:0.5rem;padding-right:0.5rem;transition-property:all;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms;}
      .uno-98db2v{--un-bg-opacity:1;background-color:hsla(2.7,81.9%,69.6%,var(--un-bg-opacity));}
      .uno-qju0i9{padding:0.625rem;--un-text-opacity:1;color:rgba(234,179,8,var(--un-text-opacity));}
      .uno-144q2o{color:rgba(187,247,208,0.5);--un-text-opacity:1;color:rgba(255,255,255,var(--un-text-opacity));}
      /* layer: default */
      .h-10{height:2.5rem;}
      .w-10{width:2.5rem;}
      .flex{display:flex;}
      .flex-col{flex-direction:column;}
      .rotate-180{--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-rotate:180deg;transform:translateX(var(--un-translate-x)) translateY(var(--un-translate-y)) translateZ(var(--un-translate-z)) rotate(var(--un-rotate)) rotateX(var(--un-rotate-x)) rotateY(var(--un-rotate-y)) rotateZ(var(--un-rotate-z)) skewX(var(--un-skew-x)) skewY(var(--un-skew-y)) scaleX(var(--un-scale-x)) scaleY(var(--un-scale-y)) scaleZ(var(--un-scale-z));}
      .items-center{align-items:center;}
      .justify-center{justify-content:center;}
      .p-1{padding:0.25rem;}
      .text-yellow-500{--un-text-opacity:1;color:rgba(234,179,8,var(--un-text-opacity));}",
      }
    `)
  })
})
