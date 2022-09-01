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
      import { ref } from 'vue'
      const bg = 'uno-98db2v'
      const bgIgnore = 'bg-[hsl(2.7,81.9%,69.6%)]'
      const index = 1
      const customClass = 'text-red'
      const bool = ref<boolean>()
      </script>

      <template>
        <div class=\\"text-center aaa\\" p=\\"4\\">
          <div text=\\"4xl\\" class=\\"rotate-180 i-carbon-campsite\\" :class=\\"bg\\" />
          <div class=\\"uno-1lreki font-(light mono)\\">
            <div class=\\"uno-jw3na0 hover:(!bg-gray-600 font-bold)\\" text=\\"#fff\\">
              {{ 'hover:(!bg-gray-600 text-red font-bold)' }}
            </div>
          </div>
          <div :class=\\"\`p-2.5 \${bool ? 'uno-kl65hf' : ''}\`\\" m-2 :hover-class=\\"['uno-y5ng0p']\\">
            class=\\"hover:bg-green\\"
          </div>
          <div flex=\\"~ col gap-1\\" class=\\"p-1\\" items-center :class=\\"bool ? 'uno-2z589z' : ''\\">
            <div i-carbon-campsite inline-block color=\\"blue\\" text=\\"xl\\" />
            {{ \`index\${index + 1}\` }}{{ \`index\` }}
          </div>
          <div flex=\\"~ col\\" border=\\"2 blue\\">
            <div text-right h-10 flex=\\"1\\" text=\\"red\\" :class=\\"{ 'text-sm': index > 0 }\\">
              0123456789
            </div>
            <div h-10 flex=\\"1\\" text-blue :class=\\"[index > 1 ? 'text' : '']\\" :style=\\"[index > 1 ? '' : '']\\" :type=\\"index > 1\\">
              {{ bgIgnore }}
            </div>
          </div>
          <div class=\\"uno-w33epq\\" w-40 h-20 ma color=\\"white\\" bg=\\"center cover\\">
            {{ 'bg-[url(https://static.runoob.com/images/demo/demo2.jpg)]' }}
          </div>
          <div class=\\"uno-tw4biu\\" :class=\\"bool ? '' : 'uno-qju0i9'\\">
            abckefghijklmnopqrstuvwxyz
          </div>
        </div>
      </template>
      ",
        "css": "/* layer: applet_shortcuts */
      .uno-tw4biu{margin:0.125rem;padding:0.25rem;font-size:1.5rem;line-height:2rem;}
      .uno-1lreki{border-width:1px;border-style:solid;--un-bg-opacity:1;background-color:rgba(191,219,254,var(--un-bg-opacity));}
      .uno-98db2v{--un-bg-opacity:1;background-color:hsla(2.7,81.9%,69.6%,var(--un-bg-opacity));}
      .uno-y5ng0p{--un-bg-opacity:1 !important;background-color:rgba(74,222,128,var(--un-bg-opacity)) !important;}
      .uno-w33epq{--un-url:url(https://static.runoob.com/images/demo/demo2.jpg);background-image:var(--un-url);}
      .uno-kl65hf{padding:0.125rem;}
      .uno-qju0i9{padding:0.625rem;--un-text-opacity:1;color:rgba(234,179,8,var(--un-text-opacity));}
      .uno-2z589z{padding-left:0.625rem;padding-right:0.625rem;--un-text-opacity:1;color:rgba(234,179,8,var(--un-text-opacity));}
      .uno-jw3na0{--un-text-opacity:1;color:rgba(248,113,113,var(--un-text-opacity));}
      /* layer: default */
      .m-2{margin:0.5rem;}
      .ma{margin:auto;}
      .inline-block{display:inline-block;}
      .h-10{height:2.5rem;}
      .h-20{height:5rem;}
      .w-40{width:10rem;}
      .flex{display:flex;}
      .rotate-180{--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-rotate:180deg;transform:translateX(var(--un-translate-x)) translateY(var(--un-translate-y)) translateZ(var(--un-translate-z)) rotate(var(--un-rotate)) rotateX(var(--un-rotate-x)) rotateY(var(--un-rotate-y)) rotateZ(var(--un-rotate-z)) skewX(var(--un-skew-x)) skewY(var(--un-skew-y)) scaleX(var(--un-scale-x)) scaleY(var(--un-scale-y)) scaleZ(var(--un-scale-z));}
      .items-center{align-items:center;}
      .gap-1{grid-gap:0.25rem;gap:0.25rem;}
      .border{border-width:1px;border-style:solid;}
      .bg-\\\\[hsl\\\\(2\\\\.7\\\\,81\\\\.9\\\\%\\\\,69\\\\.6\\\\%\\\\)\\\\]{--un-bg-opacity:1;background-color:hsla(2.7,81.9%,69.6%,var(--un-bg-opacity));}
      .hover\\\\:bg-green:hover{--un-bg-opacity:1;background-color:rgba(74,222,128,var(--un-bg-opacity));}
      .bg-\\\\[url\\\\(https\\\\:\\\\/\\\\/static\\\\.runoob\\\\.com\\\\/images\\\\/demo\\\\/demo2\\\\.jpg\\\\)\\\\]{--un-url:url(https://static.runoob.com/images/demo/demo2.jpg);background-image:var(--un-url);}
      .p-1{padding:0.25rem;}
      .p-2\\\\.5{padding:0.625rem;}
      .text-center{text-align:center;}
      .text-right{text-align:right;}
      .text-sm{font-size:0.875rem;line-height:1.25rem;}
      .text-blue{--un-text-opacity:1;color:rgba(96,165,250,var(--un-text-opacity));}
      .text-red{--un-text-opacity:1;color:rgba(248,113,113,var(--un-text-opacity));}",
      }
    `)
  })
})
