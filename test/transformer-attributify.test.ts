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
      path.resolve(__dirname, './fixtures/attributify.vue'),
    )
    const result = await transform(content.toString())
    expect(result).toMatchInlineSnapshot(`
      {
        "code": "<script setup lang=\\"ts\\">
      </script>

      <template>
        <div h-80 text-center flex flex-col align-center select-none all:transition-400 class=\\"h-80 text-center flex flex-col select-none all:transition-400\\">
          <!-- comment -->
          <input type=\\"checkbox\\" peer mt-a class=\\"mt-a\\">
          <button ref=\\"sss\\" btn-block h-10 w-10 bg-blue block hhh class=\\"btn-block h-10 w-10 bg-blue block\\">
            Button
          </button>
          <div mb-a block group peer-checked=\\"text-4xl\\" class=\\"mb-a block peer-checked-text-4xl\\">
            <div
              font-100 text-4xl mb--3 p-10
              bg-gradient=\\"to-r from-yellow-400 via-red-500 to-pink-500\\"
             class=\\"font-100 text-4xl mb--3 p-10 bg-gradient-to-r bg-gradient-from-yellow-400 bg-gradient-via-red-500 bg-gradient-to-pink-500\\">
              ~
            </div>
            <div text-5xl font-100 sm=\\"bg-blue-600\\" bg=\\"base\\" color=\\"base\\" class=\\"text-5xl font-100 sm-bg-blue-600 bg-base color-base\\">
              unocss
            </div>
            <div op-20 font-200 mt-1 tracking-wider group-hover=\\"text-teal-400 op-50\\" class=\\"op-20 font-200 mt-1 tracking-wider group-hover-text-teal-400 group-hover-op-50\\">
              Re-imaging Atomic CSS
            </div>
          </div>
        </div>
        <div flex class=\\"flex\\">
          <div ma inline-flex relative h-14 class=\\"ma inline-flex relative h-14\\">
            <input type=\\"text\\" m-0 pt-4 px-4 text-true-gray-800 peer placeholder=\\"unocss\\" un-placeholder=\\"text-red\\" class=\\"m-0 pt-4 px-4 text-true-gray-800\\">
            <label
              absolute leading-1rem left-4 pointer-events-none text-gray-7 top=\\"1/3\\" transition=\\"200 linear\\"
              peer-not-placeholder-shown=\\"-translate-y-4 scale-75 origin-top-left text-green-500\\"
              peer-focus=\\"-translate-y-4 scale-75 origin-top-left text-green-500\\"
              before=\\"content-!\\"
              after=\\"content-[!]\\"
             class=\\"absolute leading-1rem left-4 pointer-events-none text-gray-7 top-1/3 transition-200 peer-not-placeholder-shown--translate-y-4 peer-not-placeholder-shown-scale-75 peer-not-placeholder-shown-origin-top-left peer-not-placeholder-shown-text-green-500 peer-focus--translate-y-4 peer-focus-scale-75 peer-focus-origin-top-left peer-focus-text-green-500 after-content-[!]\\">Experience now</label>
          </div>
        </div>
      </template>
      ",
        "css": "/* layer: shortcuts */
      .btn-block{border-radius:0.5rem;padding-top:0.5rem;padding-bottom:0.5rem;padding-left:1rem;padding-right:1rem;}
      .bg-base{--un-bg-opacity:1;background-color:rgba(243,244,246,var(--un-bg-opacity));}
      .dark .bg-base{--un-bg-opacity:1;background-color:rgba(34,34,34,var(--un-bg-opacity));}
      .color-base{--un-text-opacity:1;color:rgba(55,65,81,var(--un-text-opacity));}
      .dark .color-base{--un-text-opacity:1;color:rgba(250,250,250,var(--un-text-opacity));}
      /* layer: default */
      .pointer-events-none{pointer-events:none;}
      .absolute{position:absolute;}
      .relative{position:relative;}
      .left-4{left:1rem;}
      .top-1\\\\/3{top:33.3333333333%;}
      .ma{margin:auto;}
      .mb--3{margin-bottom:-0.75rem;}
      .mb-a{margin-bottom:auto;}
      .mt-1{margin-top:0.25rem;}
      .mt-a{margin-top:auto;}
      .block{display:block;}
      .h-10{height:2.5rem;}
      .h-14{height:3.5rem;}
      .h-80{height:20rem;}
      .w-10{width:2.5rem;}
      .flex{display:flex;}
      .inline-flex{display:inline-flex;}
      .flex-col{flex-direction:column;}
      .origin-top-left,
      [peer=\\"\\"]:focus~.peer-focus-origin-top-left,
      [peer=\\"\\"]:not(:placeholder-shown)~.peer-not-placeholder-shown-origin-top-left{transform-origin:top left;}
      .-translate-y-4,
      [peer=\\"\\"]:focus~.peer-focus--translate-y-4,
      [peer=\\"\\"]:not(:placeholder-shown)~.peer-not-placeholder-shown--translate-y-4{--un-translate-y:-1rem;transform:translateX(var(--un-translate-x)) translateY(var(--un-translate-y)) translateZ(var(--un-translate-z)) rotate(var(--un-rotate)) rotateX(var(--un-rotate-x)) rotateY(var(--un-rotate-y)) rotateZ(var(--un-rotate-z)) skewX(var(--un-skew-x)) skewY(var(--un-skew-y)) scaleX(var(--un-scale-x)) scaleY(var(--un-scale-y)) scaleZ(var(--un-scale-z));}
      .scale-75,
      [peer=\\"\\"]:focus~.peer-focus-scale-75,
      [peer=\\"\\"]:not(:placeholder-shown)~.peer-not-placeholder-shown-scale-75{--un-scale-x:0.75;--un-scale-y:0.75;transform:translateX(var(--un-translate-x)) translateY(var(--un-translate-y)) translateZ(var(--un-translate-z)) rotate(var(--un-rotate)) rotateX(var(--un-rotate-x)) rotateY(var(--un-rotate-y)) rotateZ(var(--un-rotate-z)) skewX(var(--un-skew-x)) skewY(var(--un-skew-y)) scaleX(var(--un-scale-x)) scaleY(var(--un-scale-y)) scaleZ(var(--un-scale-z));}
      .select-none{user-select:none;}
      .bg-blue{--un-bg-opacity:1;background-color:rgba(96,165,250,var(--un-bg-opacity));}
      .bg-blue-600{--un-bg-opacity:1;background-color:rgba(37,99,235,var(--un-bg-opacity));}
      .bg-gradient-from-yellow-400,
      .from-yellow-400{--un-gradient-from:rgba(250,204,21,var(--un-from-opacity, 1));--un-gradient-to:rgba(250,204,21,0);--un-gradient-stops:var(--un-gradient-from), var(--un-gradient-to);}
      .bg-gradient-via-red-500,
      .via-red-500{--un-gradient-to:rgba(239,68,68,0);--un-gradient-stops:var(--un-gradient-from), rgba(239,68,68,var(--un-via-opacity, 1)), var(--un-gradient-to);}
      .bg-gradient-to-pink-500,
      .to-pink-500{--un-gradient-to:rgba(236,72,153,var(--un-to-opacity, 1));}
      .bg-gradient-to-r{--un-gradient-shape:to right;--un-gradient:var(--un-gradient-shape), var(--un-gradient-stops);background-image:linear-gradient(var(--un-gradient));}
      .p-10{padding:2.5rem;}
      .px-4{padding-left:1rem;padding-right:1rem;}
      .pt-4{padding-top:1rem;}
      .text-center{text-align:center;}
      .text-4xl,
      [peer=\\"\\"]:checked~.peer-checked-text-4xl{font-size:2.25rem;line-height:2.5rem;}
      .text-5xl{font-size:3rem;line-height:1;}
      .font-100{font-weight:100;}
      .font-200{font-weight:200;}
      .leading-1rem{line-height:1rem;}
      .tracking-wider{letter-spacing:0.05em;}
      .text-gray-7{--un-text-opacity:1;color:rgba(55,65,81,var(--un-text-opacity));}
      .text-green-500,
      [peer=\\"\\"]:focus~.peer-focus-text-green-500,
      [peer=\\"\\"]:not(:placeholder-shown)~.peer-not-placeholder-shown-text-green-500{--un-text-opacity:1;color:rgba(34,197,94,var(--un-text-opacity));}
      .text-red{--un-text-opacity:1;color:rgba(248,113,113,var(--un-text-opacity));}
      .text-teal-400,
      [group=\\"\\"]:hover .group-hover-text-teal-400{--un-text-opacity:1;color:rgba(45,212,191,var(--un-text-opacity));}
      .text-true-gray-800{--un-text-opacity:1;color:rgba(38,38,38,var(--un-text-opacity));}
      .op-20{opacity:0.2;}
      .op-50,
      [group=\\"\\"]:hover .group-hover-op-50{opacity:0.5;}
      .all\\\\:transition-400 *{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:400ms;}
      .transition{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms;}
      .transition-200{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:200ms;}
      .after-content-\\\\[\\\\!\\\\]::after,
      .content-\\\\[\\\\!\\\\]{content:\\"!\\";}
      .m-0{margin:0rem;}
      @media (min-width: 640px){
      .sm-bg-blue-600{--un-bg-opacity:1;background-color:rgba(37,99,235,var(--un-bg-opacity));}
      }",
      }
    `)
  })
})
