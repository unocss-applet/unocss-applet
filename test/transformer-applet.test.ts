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
      const customClass = 'text-red'
      const bool = true
      </script>

      <template>
        <div class=\\"uno-j2nj36 aaa\\">
          <div text=\\"4xl\\" class=\\"uno-e22fjo i-carbon-campsite\\" :class=\\"bg\\" />
          <div class=\\"uno-1lreki font-(light mono)\\">
            <div class=\\"uno-4oaq3e hover:(!bg-gray-400 font-medium)\\" text=\\"#6f4\\">
              0123456789
            </div>
          </div>
          <div :class=\\"{ 'bg-blue': bool }\\" p-2 :hover-class=\\"['uno-y5ng0p']\\">
            class=\\"hover:bg-green\\"
          </div>
          <div class=\\"uno-82knp1\\" :class=\\"bool ? 'uno-2z589z' : ''\\">
            {{ \`index\${index + 1}\` }}
          </div>
          <div i-carbon-campsite inline-block color=\\"blue\\" />
          <div flex=\\"~ col gap-2\\" border=\\"2 blue\\">
            <div text-center w-10 h-10 flex=\\"1\\" text=\\"red\\">
              1
            </div>
            <div w-10 h-10 flex=\\"1\\" text-blue>
              2
            </div>
          </div>
          <uni-easyinput />
          <div class=\\"uno-gdmskp\\" w-20 h-10>
            bg-img
          </div>
          <div class=\\"uno-tw4biu\\" :class=\\"bool ? '' : 'uno-qju0i9'\\">
            abckefghijklmnopqrstuvwxyz
          </div>
          <!-- eslint-disable-next-line vue/prefer-separate-static-class -->
          <view :class=\\"['underline', customClass]\\">
            aaa
          </view>
        </div>
      </template>

      ",
        "css": "/* layer: applet_shortcuts */
      .uno-tw4biu{margin:0.125rem;padding:0.25rem;font-size:1.5rem;line-height:2rem;}
      .uno-j2nj36{display:flex;flex-direction:column;align-items:center;justify-content:center;}
      .uno-e22fjo{--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-rotate:180deg;transform:translateX(var(--un-translate-x)) translateY(var(--un-translate-y)) translateZ(var(--un-translate-z)) rotate(var(--un-rotate)) rotateX(var(--un-rotate-x)) rotateY(var(--un-rotate-y)) rotateZ(var(--un-rotate-z)) skewX(var(--un-skew-x)) skewY(var(--un-skew-y)) scaleX(var(--un-scale-x)) scaleY(var(--un-scale-y)) scaleZ(var(--un-scale-z));}
      .uno-1lreki{border-width:1px;border-style:solid;--un-bg-opacity:1;background-color:rgba(191,219,254,var(--un-bg-opacity));}
      .uno-98db2v{--un-bg-opacity:1;background-color:hsla(2.7,81.9%,69.6%,var(--un-bg-opacity));}
      .uno-y5ng0p{--un-bg-opacity:1 !important;background-color:rgba(74,222,128,var(--un-bg-opacity)) !important;}
      .uno-gdmskp{--un-url:url(https://static.runoob.com/images/demo/demo3.jpg);background-image:var(--un-url);}
      .uno-82knp1{padding:0.25rem;}
      .uno-qju0i9{padding:0.625rem;--un-text-opacity:1;color:rgba(234,179,8,var(--un-text-opacity));}
      .uno-2z589z{padding-left:0.625rem;padding-right:0.625rem;--un-text-opacity:1;color:rgba(234,179,8,var(--un-text-opacity));}
      .uno-4oaq3e{--un-text-opacity:1;color:rgba(255,255,255,var(--un-text-opacity));}
      /* layer: default */
      .inline-block{display:inline-block;}
      .h-10{height:2.5rem;}
      .w-10{width:2.5rem;}
      .w-20{width:5rem;}
      .flex{display:flex;}
      .gap-2{grid-gap:0.5rem;gap:0.5rem;}
      .border{border-width:1px;border-style:solid;}
      .bg-blue{--un-bg-opacity:1;background-color:rgba(96,165,250,var(--un-bg-opacity));}
      .hover\\\\:bg-green:hover{--un-bg-opacity:1;background-color:rgba(74,222,128,var(--un-bg-opacity));}
      .p-2{padding:0.5rem;}
      .text-center{text-align:center;}
      .text-red{--un-text-opacity:1;color:rgba(248,113,113,var(--un-text-opacity));}
      .underline{text-decoration-line:underline;}",
      }
    `)
  })
})
