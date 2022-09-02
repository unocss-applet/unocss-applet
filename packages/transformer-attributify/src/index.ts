import MagicString from 'magic-string'
import type { SourceCodeTransformer } from 'unocss'
import { isValidSelector } from 'unocss'
import type { TransformerAttributifyOptions } from './types'

const strippedPrefixes = [
  'v-bind:',
  ':',
]

const splitterRE = /[\s'"`;]+/g
// const elementRE = /<\w(?=.*>)[\w:\.$-]*\s((?:['"`\{].*?['"`\}]|.*?)*?)>/gs
const elementRE = /<\w(?=.*>)[\w:\.$-]*\s(((".*?>?.*?")|.*?)*?)\/?>/gs
const valuedAttributeRE = /([?]|(?!\d|-{2}|-\d)[a-zA-Z0-9\u00A0-\uFFFF-_:!%-]+)(?:={?(["'])([^\2]*?)\2}?)?/g

export const defaultIgnoreAttributes = ['placeholder', 'setup', 'lang', 'scoped']

export default function transformerAttributify(options: TransformerAttributifyOptions = {}): SourceCodeTransformer {
  const ignoreAttributes = options?.ignoreAttributes ?? defaultIgnoreAttributes
  const nonValuedAttribute = options?.nonValuedAttribute ?? true
  const prefix = options.prefix ?? 'un-'
  const prefixedOnly = options.prefixedOnly ?? false
  const deleteClass = options.deleteClass ?? false

  return {
    name: 'transformer-attributify',
    enforce: 'pre',
    async transform(s, _, { uno }) {
      const code = new MagicString(s.toString())

      const elementMatches = code.original.matchAll(elementRE)
      for (const eleMatch of elementMatches) {
        const start = eleMatch.index!
        let matchStrTemp = eleMatch[0]
        let existsClass = ''
        const attrSelectors: string[] = []
        const valuedAttributes = Array.from((eleMatch[1] || '').matchAll(valuedAttributeRE))

        for (const attribute of valuedAttributes) {
          const matchStr = attribute[0]
          const name = attribute[1]
          const content = attribute[3]
          let _name = prefixedOnly ? name.replace(prefix, '') : name

          if (!ignoreAttributes.includes(_name)) {
            for (const prefix of strippedPrefixes) {
              if (_name.startsWith(prefix)) {
                _name = _name.slice(prefix.length)
                break
              }
            }

            if (!content) {
              if (isValidSelector(_name) && nonValuedAttribute !== false) {
                if (await uno.parseToken(_name)) {
                  attrSelectors.push(_name)
                  deleteClass && (matchStrTemp = matchStrTemp.replace(` ${_name}`, ''))
                }
              }
            }
            else {
              if (['class', 'className'].includes(_name)) {
                if (!name.includes(':'))
                  existsClass = content
              }
              else {
                const attrs = await Promise.all(content.split(splitterRE).filter(Boolean)
                  .map(async (v) => {
                    let token = v
                    // b="~ green dark:(red 2)"
                    if (v === '~') { token = _name }
                    else if (v.includes(':')) {
                      const splitV = v.split(':')
                      token = `${splitV[0]}:${splitV[1]}`
                    }
                    else if (v.startsWith('!')) { token = `!${_name}-${v.slice(1)}` }
                    else { token = `${_name}-${v}` }

                    return [token, !!await uno.parseToken(token)] as const
                  }))
                const result = attrs.filter(([, v]) => v).map(([v]) => v)
                attrSelectors.push(...result)
                deleteClass && (matchStrTemp = matchStrTemp.replace(` ${matchStr}`, ''))
              }
            }
          }
        }
        if (attrSelectors.length) {
          if (!existsClass) {
            const sliceNum = matchStrTemp.endsWith('/>') ? -2 : -1
            matchStrTemp = `${matchStrTemp.slice(0, sliceNum)} class="${attrSelectors.join(' ')}"${matchStrTemp.slice(sliceNum)}`
          }
          else {
            matchStrTemp = matchStrTemp.replace(`"${existsClass}"`, `"${existsClass} ${attrSelectors.join(' ')}"`)
          }
          code.overwrite(start, start + eleMatch[0].length, matchStrTemp)
        }
      }

      s.overwrite(0, s.original.length, code.toString())
    },
  }
}
