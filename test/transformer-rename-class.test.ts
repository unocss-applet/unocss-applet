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
    const result = await transform(`
    <script setup lang="ts">
    const bg = 'bg-[hsl(2.7,81.9%,69.6%)]'
    </script>
    
    <template>
      <div class="flex aaa flex-col justify-center items-center">
        <div class="text-green-500 text-4xl rotate-180 i-carbon-campsite" />
        <div class="border bg-blue-200 px-2 transition-all !bg-red-500">
          <div class="text-green-200/50">
            0123456789
          </div>
        </div>
        <div class="p-1" :class="true ? 'text-yellow-500' : ''">
          {{ \`index\${index + 1}\` }}
        </div>
        <div class="py-3.5 grid-cols-[0.7fr_repeat(7,1fr)]">
          py-3
        </div>
        <div hover-class="text-green-500/50">
          uniapp
        </div>
        <div class="m-0.5 p-1 text-2xl" :class="true ? '' : 'text-yellow-500 p-2.5'">
          abckefghijklmnopqrstuvwxyz
        </div>
      </div>
    </template>
    `)
    expect(result).toMatchInlineSnapshot(`
      {
        "code": "
          <script setup lang=\\"ts\\">
          const bg = 'uno-98db2v'
          </script>
          
          <template>
            <div class=\\"flex aaa flex-col justify-center items-center\\">
              <div class=\\"text-green-500 text-4xl rotate-180 i-carbon-campsite\\" />
              <div class=\\"uno-2gzdpm\\">
                <div class=\\"uno-2zpnl9\\">
                  0123456789
                </div>
              </div>
              <div class=\\"p-1\\" :class=\\"true ? 'text-yellow-500' : ''\\">
                {{ \`index\${index + 1}\` }}
              </div>
              <div class=\\"uno-0tr0xg\\">
                py-3
              </div>
              <div hover-class=\\"uno-cteohy\\">
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
      .uno-2gzdpm{border-width:1px;border-style:solid;--un-bg-opacity:1;background-color:rgba(191,219,254,var(--un-bg-opacity));--un-bg-opacity:1 !important;background-color:rgba(239,68,68,var(--un-bg-opacity)) !important;padding-left:0.5rem;padding-right:0.5rem;transition-property:all;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms;}
      .uno-98db2v{--un-bg-opacity:1;background-color:hsla(2.7,81.9%,69.6%,var(--un-bg-opacity));}
      .uno-qju0i9{padding:0.625rem;--un-text-opacity:1;color:rgba(234,179,8,var(--un-text-opacity));}
      .uno-2zpnl9{color:rgba(187,247,208,0.5);}
      .uno-cteohy{color:rgba(34,197,94,0.5);}
      /* layer: default */
      .flex{display:flex;}
      .flex-col{flex-direction:column;}
      .rotate-180{--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-rotate:180deg;transform:translateX(var(--un-translate-x)) translateY(var(--un-translate-y)) translateZ(var(--un-translate-z)) rotate(var(--un-rotate)) rotateX(var(--un-rotate-x)) rotateY(var(--un-rotate-y)) rotateZ(var(--un-rotate-z)) skewX(var(--un-skew-x)) skewY(var(--un-skew-y)) scaleX(var(--un-scale-x)) scaleY(var(--un-scale-y)) scaleZ(var(--un-scale-z));}
      .items-center{align-items:center;}
      .justify-center{justify-content:center;}
      .p-1{padding:0.25rem;}
      .py-3{padding-top:0.75rem;padding-bottom:0.75rem;}
      .text-4xl{font-size:2.25rem;line-height:2.5rem;}
      .text-green-500{--un-text-opacity:1;color:rgba(34,197,94,var(--un-text-opacity));}
      .text-yellow-500{--un-text-opacity:1;color:rgba(234,179,8,var(--un-text-opacity));}",
      }
    `)
  })
})
