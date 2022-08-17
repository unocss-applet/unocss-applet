import { promises as fs } from 'fs'
import path from 'path'
import { describe, expect, test } from 'vitest'
import type { UnoGenerator } from '@unocss/core'
import { createGenerator } from '@unocss/core'
import MagicString from 'magic-string'
import transformerRenameClass from '@unocss-applet/transformer-rename-class'
import presetUno from '@unocss/preset-uno'

describe('transformer-rename-class', () => {
  const uno = createGenerator({
    presets: [
      presetUno(),
    ],
  })
  const transformer = transformerRenameClass()

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
      </script>

      <template>
        <div class=\\"flex aaa flex-col justify-center items-center\\">
          <div class=\\"text-green-500 text-4xl rotate-180 i-carbon-campsite\\" :class=\\"bg\\" />
          <div class=\\"border bg-blue-200 px-2 transition-all bg-red-500 font-(light mono) \\">
            <div class=\\"uno-849du6\\">
              0123456789
            </div>
          </div>
          <div class=\\"p-1\\" :class=\\"true ? 'text-yellow-500' : ''\\">
            {{ \`index\${index + 1}\` }}
          </div>
          <div class=\\"uno-0tr0xg\\">
            py-4.5
          </div>
          <div :class=\\"{ 'is-textarea-icon': type === 'textarea' }\\">
            uniapp
          </div>
          <div
            class=\\"uno-g7ig4t\\"
            :class=\\"{ 'uno-g7ig4t': type === 'textarea' }\\"
          >
            uniapp
          </div>
          <div class=\\"uno-tw4biu\\" :class=\\"true ? '' : 'uno-qju0i9'\\">
            abckefghijklmnopqrstuvwxyz
          </div>
        </div>
      </template>
      ",
        "css": "/* layer: applet_shortcuts */
      .uno-0tr0xg{grid-template-columns:0.7fr repeat(7,1fr);padding-top:0.875rem;padding-bottom:0.875rem;}
      .uno-tw4biu{margin:0.125rem;padding:0.25rem;font-size:1.5rem;line-height:2rem;}
      .uno-849du6:hover{--un-bg-opacity:1 !important;background-color:rgba(156,163,175,var(--un-bg-opacity)) !important;font-weight:500;--un-text-opacity:1;color:rgba(255,255,255,var(--un-text-opacity));}
      .uno-98db2v{--un-bg-opacity:1;background-color:hsla(2.7,81.9%,69.6%,var(--un-bg-opacity));}
      .uno-g7ig4t{--un-url:url(https://avatars.githubusercontent.com/u/40738594?s=40&v=4);background-image:var(--un-url);}
      .uno-qju0i9{padding:0.625rem;--un-text-opacity:1;color:rgba(234,179,8,var(--un-text-opacity));}
      .uno-849du6{color:rgba(187,247,208,0.5);}
      /* layer: default */
      .flex{display:flex;}
      .flex-col{flex-direction:column;}
      .rotate-180{--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-rotate:180deg;transform:translateX(var(--un-translate-x)) translateY(var(--un-translate-y)) translateZ(var(--un-translate-z)) rotate(var(--un-rotate)) rotateX(var(--un-rotate-x)) rotateY(var(--un-rotate-y)) rotateZ(var(--un-rotate-z)) skewX(var(--un-skew-x)) skewY(var(--un-skew-y)) scaleX(var(--un-scale-x)) scaleY(var(--un-scale-y)) scaleZ(var(--un-scale-z));}
      .items-center{align-items:center;}
      .justify-center{justify-content:center;}
      .border{border-width:1px;border-style:solid;}
      .bg-blue-200{--un-bg-opacity:1;background-color:rgba(191,219,254,var(--un-bg-opacity));}
      .bg-red-500{--un-bg-opacity:1;background-color:rgba(239,68,68,var(--un-bg-opacity));}
      .p-1{padding:0.25rem;}
      .px-2{padding-left:0.5rem;padding-right:0.5rem;}
      .py-4\\\\.5{padding-top:1.125rem;padding-bottom:1.125rem;}
      .text-4xl{font-size:2.25rem;line-height:2.5rem;}
      .text-green-500{--un-text-opacity:1;color:rgba(34,197,94,var(--un-text-opacity));}
      .text-yellow-500{--un-text-opacity:1;color:rgba(234,179,8,var(--un-text-opacity));}
      .transition-all{transition-property:all;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms;}",
      }
    `)
  })
})
