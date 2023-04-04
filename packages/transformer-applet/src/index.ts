import type { SourceCodeTransformer } from 'unocss'
import MagicString from 'magic-string'
import type { TransformerAppletOptions } from './types'
import { compileApplet } from './compile'

export * from './types'

// Regular expression of characters to be escaped
const charReg = /[.:%!#()[\/\],]/

const elementRE = /<\w(?=.*>)[\w:\.$-]*\s(((".*?>?.*?")|.*?)*?)\/?>/gs
const valuedAttributeRE = /([?]|(?!\d|-{2}|-\d)[a-zA-Z0-9\u00A0-\uFFFF-_:!%-]+)(?:={?(["'])([^\2]*?)\2}?)?/g
const stringRE = /"([\s\S]*?)"|'([\s\S]*?)'/g
const templateLiteralsRE = /`([\s\S]*?)`/g

export default function transformerApplet(options: TransformerAppletOptions = {}): SourceCodeTransformer {
  const enable = options.enable ?? true
  const ignorePrefix = options.ignorePrefix || 'applet-ignore'
  const ignorePrefixRE = new RegExp(`${ignorePrefix}:*\\s*`, 'g')

  return {
    name: 'transformer-applet',
    enforce: 'pre',
    async transform(s, id, ctx) {
      let code = new MagicString(s.toString())
      if (!enable) {
        code.overwrite(0, code.toString().length, code.toString().replaceAll(ignorePrefixRE, ''))
        s.overwrite(0, s.original.length, code.toString())
        return
      }

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
              if (!replacements.length)
                continue
              matchStrTemp = matchStrTemp.replace(content, replacements.join(' '))
            }
          }
        }
        if (eleMatch[0] !== matchStrTemp)
          code.overwrite(start, start + eleMatch[0].length, matchStrTemp)
      }
      code = new MagicString(code.toString())

      // process string, only effective with '' or ""
      const stringMatches = code.original.matchAll(stringRE)
      for (const match of stringMatches) {
        const content = match[1] ?? match[2]

        // ignore empty string
        if (!content || content.startsWith(ignorePrefix))
          continue
        const start = match.index!

        if (/`/g.test(content))
          continue

        if (charReg.test(content)) {
          const replacements = await compileApplet(content, ctx, options)
          if (!replacements.length)
            continue
          code.overwrite(start, start + match[0].length, `'${replacements.join(' ')}'`)
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
          if (!replacements.length)
            continue
          code.overwrite(start, start + match[0].length, `\`${replacements.join(' ')}\``)
        }
      }

      // UniApp will replace string with a variable, so we need to ignore it when vue file is compiled
      if (!/\.vue$/.test(id))
        code.overwrite(0, code.toString().length, code.toString().replaceAll(ignorePrefixRE, ''))

      s.overwrite(0, s.original.length, code.toString())
    },
  }
}
