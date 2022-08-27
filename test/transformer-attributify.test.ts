import { promises as fs } from 'fs'
import path from 'path'
import { describe, expect, test } from 'vitest'
import type { UnoGenerator } from '@unocss/core'
import { createGenerator } from '@unocss/core'
import MagicString from 'magic-string'
import transformerAttributify from '@unocss-applet/transformer-attributify'
import presetUno from '@unocss/preset-uno'

describe('transformer-attributify', () => {
  const uno = createGenerator({
    presets: [
      presetUno(),
    ],
  })
  const transformer = transformerAttributify()

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
      const bg = 'bg-[hsl(2.7,81.9%,69.6%)]'
      const index = 1
      const type = 'text'
      const bool = true
      </script>

      <template>
        <div class=\\"flex aaa flex-col justify-center items-center\\">
          <div class=\\"rotate-180 i-carbon-campsite text-green-500 text-4xl\\" :class=\\"bool ? bg : ''\\" />
          <div class=\\"border bg-blue-200 px-2 transition-all bg-red-500 font-(light mono) h20\\">
            <div class=\\"text-green-200/50 hover:(!bg-gray-400 text-white font-medium)\\">
              0123456789
            </div>
          </div>
          <div class=\\"p-1\\" :class=\\"bool ? 'text-yellow-500' : ''\\">
            {{ \`index\${index + 1}\` }}
          </div>
          <div class=\\"grid-cols-[0.7fr_repeat(7,1fr)] flex flex-col\\">
            <div class=\\"w-10 h-10 flex-1\\">
              1
            </div>
            <div class=\\"w-10 h-10 flex-1\\">
              2
            </div>
          </div>
          <uni-easyinput />
          <div class=\\"m-0.5 p-1 text-2xl\\" :class=\\"bool ? '' : 'text-yellow-500 p-2.5'\\">
            abckefghijklmnopqrstuvwxyz
          </div>
        </div>
      </template>
      ",
        "css": "/* layer: default */
      .grid-cols-\\\\[0\\\\.7fr_repeat\\\\(7\\\\,1fr\\\\)\\\\]{grid-template-columns:0.7fr repeat(7,1fr);}
      .m-0\\\\.5{margin:0.125rem;}
      .h-10{height:2.5rem;}
      .h20{height:5rem;}
      .w-10{width:2.5rem;}
      .flex{display:flex;}
      .flex-1{flex:1 1 0%;}
      .flex-col{flex-direction:column;}
      .rotate-180{--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-rotate:180deg;transform:translateX(var(--un-translate-x)) translateY(var(--un-translate-y)) translateZ(var(--un-translate-z)) rotate(var(--un-rotate)) rotateX(var(--un-rotate-x)) rotateY(var(--un-rotate-y)) rotateZ(var(--un-rotate-z)) skewX(var(--un-skew-x)) skewY(var(--un-skew-y)) scaleX(var(--un-scale-x)) scaleY(var(--un-scale-y)) scaleZ(var(--un-scale-z));}
      .items-center{align-items:center;}
      .justify-center{justify-content:center;}
      .border{border-width:1px;border-style:solid;}
      .bg-\\\\[hsl\\\\(2\\\\.7\\\\,81\\\\.9\\\\%\\\\,69\\\\.6\\\\%\\\\)\\\\]{--un-bg-opacity:1;background-color:hsla(2.7,81.9%,69.6%,var(--un-bg-opacity));}
      .bg-blue-200{--un-bg-opacity:1;background-color:rgba(191,219,254,var(--un-bg-opacity));}
      .bg-red-500{--un-bg-opacity:1;background-color:rgba(239,68,68,var(--un-bg-opacity));}
      .p-1{padding:0.25rem;}
      .p-2\\\\.5{padding:0.625rem;}
      .px-2{padding-left:0.5rem;padding-right:0.5rem;}
      .text-2xl{font-size:1.5rem;line-height:2rem;}
      .text-4xl{font-size:2.25rem;line-height:2.5rem;}
      .text-green-200\\\\/50{color:rgba(187,247,208,0.5);}
      .text-green-500{--un-text-opacity:1;color:rgba(34,197,94,var(--un-text-opacity));}
      .text-white{--un-text-opacity:1;color:rgba(255,255,255,var(--un-text-opacity));}
      .text-yellow-500{--un-text-opacity:1;color:rgba(234,179,8,var(--un-text-opacity));}
      .transition-all{transition-property:all;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms;}",
      }
    `)
  })
})
