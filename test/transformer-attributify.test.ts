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
    shortcuts: [
      // you could still have object style
      {
        'bg-base': 'bg-gray-100 dark:bg-dark',
        'color-base': 'text-gray-700 dark:text-light-2',
        'color-base-second': 'text-gray-400 dark:text-gray-500/60',
        'btn': 'py-2 px-4 font-semibold rounded-lg shadow-md',
      },
      // dynamic shortcuts
      [/^btn-(.*)$/, ([, c]) => `bg-${c}-400 text-${c}-100 py-2 px-4 rounded-lg`],
    ],
    presets: [
      presetUno({ attributifyPseudo: true }),
    ],
    rules: [
      [/^m-(\d)$/, ([, d]) => ({ margin: `${+d / 4}rem` })],
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
      import { ref } from 'vue'
      const bg = 'bg-[hsl(2.7,81.9%,69.6%)]'
      const bgIgnore = 'applet-ignore: bg-[hsl(2.7,81.9%,69.6%)]'
      const index = 1
      const customClass = 'text-red'
      const bool = ref<boolean>()
      </script>

      <template>
        <div class=\\"text-center aaa p-4\\" p=\\"4\\">
          <div text=\\"4xl\\" class=\\"rotate-180 i-carbon-campsite text-4xl\\" :class=\\"bg\\" />
          <div class=\\"border bg-blue-200 font-(light mono) \\">
            <div class=\\"hover:(!bg-gray-600 text-red font-bold) text-#fff\\" text=\\"#fff\\">
              {{ 'applet-ignore: hover:(!bg-gray-600 text-red font-bold)' }}
            </div>
          </div>
          <div :class=\\"\`p-2.5 \${bool ? 'p-0.5' : ''}\`\\" m-2 :hover-class=\\"['!bg-green']\\" class=\\"m-2\\">
            class=\\"hover:bg-green\\"
          </div>
          <div flex=\\"~ col gap-1\\" class=\\"p-1 flex flex-col flex-gap-1 items-center\\" items-center :class=\\"bool ? 'text-yellow-500 px-2.5' : ''\\">
            <div i-carbon-campsite inline-block color=\\"blue\\" text=\\"xl !red\\"  class=\\"inline-block color-blue text-xl !text-red\\"/>
            {{ \`index\${index + 1}\` }}{{ \`index\` }}
          </div>
          <div flex=\\"~ col\\" border=\\"2 blue\\" class=\\"flex flex-col border-2 border-blue\\">
            <div text-right h-10 flex=\\"1\\" text=\\"red\\" :class=\\"{ 'text-sm': index > 0 }\\" class=\\"text-right h-10 flex-1 text-red\\">
              0123456789
            </div>
            <div h-10 flex=\\"1\\" text-blue :class=\\"[index > 1 ? 'text' : '']\\" :style=\\"[index > 1 ? '' : '']\\" :type=\\"index > 1\\" class=\\"h-10 flex-1 text-blue\\">
              {{ bgIgnore }}
            </div>
          </div>
          <div class=\\"bg-[url(https://static.runoob.com/images/demo/demo2.jpg)] w-40 h-20 ma color-white bg-center bg-cover\\" w-40 h-20 ma color=\\"white\\" bg=\\"center cover\\">
            {{ 'applet-ignore: bg-[url(https://static.runoob.com/images/demo/demo2.jpg)]' }}
          </div>
          <div class=\\"m-0.5 p-1 text-2xl\\" :class=\\"bool ? '' : 'text-yellow-500 p-2.5'\\">
            abckefghijklmnopqrstuvwxyz
          </div>
        </div>
      </template>
      ",
        "css": "/* layer: default */
      .m-0\\\\.5{margin:0.125rem;}
      .ma{margin:auto;}
      .inline-block{display:inline-block;}
      .h-10{height:2.5rem;}
      .h-20{height:5rem;}
      .w-40{width:10rem;}
      .flex{display:flex;}
      .flex-1{flex:1 1 0%;}
      .flex-col{flex-direction:column;}
      .rotate-180{--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-rotate:180deg;transform:translateX(var(--un-translate-x)) translateY(var(--un-translate-y)) translateZ(var(--un-translate-z)) rotate(var(--un-rotate)) rotateX(var(--un-rotate-x)) rotateY(var(--un-rotate-y)) rotateZ(var(--un-rotate-z)) skewX(var(--un-skew-x)) skewY(var(--un-skew-y)) scaleX(var(--un-scale-x)) scaleY(var(--un-scale-y)) scaleZ(var(--un-scale-z));}
      .items-center{align-items:center;}
      .flex-gap-1,
      .gap-1{grid-gap:0.25rem;gap:0.25rem;}
      .border{border-width:1px;border-style:solid;}
      .border-2{border-width:2px;border-style:solid;}
      .border-blue{--un-border-opacity:1;border-color:rgba(96,165,250,var(--un-border-opacity));}
      .\\\\!bg-green{--un-bg-opacity:1 !important;background-color:rgba(74,222,128,var(--un-bg-opacity)) !important;}
      .bg-\\\\[hsl\\\\(2\\\\.7\\\\,81\\\\.9\\\\%\\\\,69\\\\.6\\\\%\\\\)\\\\]{--un-bg-opacity:1;background-color:hsla(2.7,81.9%,69.6%,var(--un-bg-opacity));}
      .bg-blue-200{--un-bg-opacity:1;background-color:rgba(191,219,254,var(--un-bg-opacity));}
      .hover\\\\:bg-green:hover{--un-bg-opacity:1;background-color:rgba(74,222,128,var(--un-bg-opacity));}
      .bg-\\\\[url\\\\(https\\\\:\\\\/\\\\/static\\\\.runoob\\\\.com\\\\/images\\\\/demo\\\\/demo2\\\\.jpg\\\\)\\\\]{--un-url:url(https://static.runoob.com/images/demo/demo2.jpg);background-image:var(--un-url);}
      .bg-cover{background-size:cover;}
      .bg-center{background-position:center;}
      .p-0\\\\.5{padding:0.125rem;}
      .p-1{padding:0.25rem;}
      .p-2\\\\.5{padding:0.625rem;}
      .p-4{padding:1rem;}
      .px-2\\\\.5{padding-left:0.625rem;padding-right:0.625rem;}
      .text-center{text-align:center;}
      .text-right{text-align:right;}
      .text-2xl{font-size:1.5rem;line-height:2rem;}
      .text-4xl{font-size:2.25rem;line-height:2.5rem;}
      .text-sm{font-size:0.875rem;line-height:1.25rem;}
      .text-xl{font-size:1.25rem;line-height:1.75rem;}
      .color-blue,
      .text-blue{--un-text-opacity:1;color:rgba(96,165,250,var(--un-text-opacity));}
      .color-white,
      .text-\\\\#fff{--un-text-opacity:1;color:rgba(255,255,255,var(--un-text-opacity));}
      .\\\\!text-red{--un-text-opacity:1 !important;color:rgba(248,113,113,var(--un-text-opacity)) !important;}
      .text-red{--un-text-opacity:1;color:rgba(248,113,113,var(--un-text-opacity));}
      .text-yellow-500{--un-text-opacity:1;color:rgba(234,179,8,var(--un-text-opacity));}
      .m-2{margin:0.5rem;}",
      }
    `)
  })
})
