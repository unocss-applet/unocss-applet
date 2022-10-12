import type { SourceCodeTransformer } from 'unocss'
import MagicString from 'magic-string'
import type { TransformerAppletOptions } from './types'
import { compileApplet } from './compile'

// Regular expression of characters to be escaped
const charReg = /[.:%!#()[\/\],]/

const elementRE = /<\w(?=.*>)[\w:\.$-]*\s(((".*?>?.*?")|.*?)*?)\/?>/gs
const valuedAttributeRE = /([?]|(?!\d|-{2}|-\d)[a-zA-Z0-9\u00A0-\uFFFF-_:!%-]+)(?:={?(["'])([^\2]*?)\2}?)?/g
const stringRE = /'(.*?)'|/g
const templateLiteralsRE = /`([\s\S]*?)`/g

export default function transformerApplet(options: TransformerAppletOptions = {}): SourceCodeTransformer {
  const ignorePrefix = options.ignorePrefix || 'applet-ignore:'
  return {
    name: 'transformer-applet',
    enforce: 'pre',
    async transform(s, id, ctx) {
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

      // process string, only effective with ''
      const stringMatches = code.original.matchAll(stringRE)
      for (const match of stringMatches) {
        // ignore empty string
        if (!match[1])
          continue

        const start = match.index!
        let content = match[1]

        if (content.startsWith(ignorePrefix)) {
          // UniApp will replace string with a variable, so we need to ignore it when vue file is compiled
          if (!/\.vue$/.test(id)) {
            content = content.substring(ignorePrefix.length).trim()
            code.overwrite(start, start + match[0].length, match[0].replace(match[1], content))
          }
        }
        else {
          // There may be no need
          // https://tailwindcss.com/docs/background-image#arbitrary-values
          // skip all the image formats in HTML for bg-[url('...')]
          if (/\.(png|jpg|jpeg|gif|svg)/g.test(content))
            continue
          // skip http(s)://
          if (/http(s)?:\/\//g.test(content))
            continue

          if (charReg.test(content)) {
            const replacements = await compileApplet(content, ctx, options)
            code.overwrite(start, start + match[0].length, `'${replacements.join(' ')}'`)
          }
        }
      }

      // process template literals, only effective with ``
      code = new MagicString(code.toString())
      const templateLiteralsMatches = code.original.matchAll(templateLiteralsRE)
      for (const match of templateLiteralsMatches) {
        const start = match.index!
        const content = match[1]
        // split content
        if (charReg.test(content)) {
          const replacements = await compileApplet(content, ctx, options)
          code.overwrite(start, start + match[0].length, `\`${replacements.join(' ')}\``)
        }
      }
      s.overwrite(0, s.original.length, code.toString())
    },
  }
}

