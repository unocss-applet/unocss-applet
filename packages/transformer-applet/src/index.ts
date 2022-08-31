import type { SourceCodeTransformer } from 'unocss'
import MagicString from 'magic-string'
import type { TransformerAppletOptions } from './types'
import { compileApplet } from './compile'

const elementRE = /<\w(?=.*>)[\w:\.$-]*\s(((".*?>?.*?")|.*?)*?)\/?>/gs
const valuedAttributeRE = /([?]|(?!\d|-{2}|-\d)[a-zA-Z0-9\u00A0-\uFFFF-_:!%-]+)(?:={?(["'])([^\2]*?)\2}?)?/g

// Regular expression of characters to be escaped
const charReg = /[.:%!#()[\/\],]/

const string1RE = /([']).*?(['])/g
const string2RE = /([\`]).*?([\`])/g

export default function transformerApplet(options: TransformerAppletOptions = {}): SourceCodeTransformer {
  return {
    name: 'transformer-applet',
    enforce: 'pre',
    async transform(s, _, ctx) {
      let code = new MagicString(s.toString())

      // process class attribute
      const elementMatches = code.original.matchAll(elementRE)
      for (const eleMatch of elementMatches) {
        const start = eleMatch.index!
        let matchStrTemp = eleMatch[0]
        const valuedAttributes = Array.from((eleMatch[1] || '').matchAll(valuedAttributeRE))

        for (const attribute of valuedAttributes) {
          // const matchStr = attribute[0]
          const name = attribute[1]
          const content = attribute[3]

          if (!content)
            continue

          if (['class', 'className', 'hover-class'].includes(name)) {
            if (name.includes(':'))
              continue

            if (charReg.test(content)) {
              const replacements = await compileApplet(content, ctx, options)
              matchStrTemp = matchStrTemp.replace(content, replacements.join(' '))
            }
          }
        }
        if (eleMatch[0] !== matchStrTemp)
          code.overwrite(start, start + eleMatch[0].length, matchStrTemp)
      }
      code = new MagicString(code.toString())

      // process string1
      const string1Matches = [...code.original.matchAll(string1RE)]
      for (const match of string1Matches) {
        // There may be no need
        // https://tailwindcss.com/docs/background-image#arbitrary-values
        // skip all the image formats in HTML for bg-[url('...')]
        if (/\.(png|jpg|jpeg|gif|svg)/g.test(match[0]))
          continue
        // skip http(s)://
        if (/http(s)?:\/\//g.test(match[0]))
          continue

        const start = match.index!
        const body = match[0].slice(1, -1)
        if (charReg.test(body)) {
          const replacements = await compileApplet(body, ctx, options)
          code.overwrite(start, start + match[0].length, `'${replacements.join(' ')}'`)
        }
      }

      // process string2
      const string2Matches = [...code.original.matchAll(string2RE)]
      for (const match of string2Matches) {
        // skip `${...}`
        if (/\$\{.*\}/g.test(match[0]))
          continue

        const start = match.index!
        const body = match[0].slice(1, -1)
        if (charReg.test(body)) {
          const replacements = await compileApplet(body, ctx, options)
          code.overwrite(start, start + match[0].length, `'${replacements.join(' ')}'`)
        }
      }
      s.overwrite(0, s.original.length, code.toString())
    },
  }
}

