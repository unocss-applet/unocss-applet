import MagicString from 'magic-string'
import type { SourceCodeTransformer } from 'unocss'
import { isValidSelector } from 'unocss'

export interface TransformerAttributifyOptions {

  /**
    * @default 'un-'
    */
  prefix?: string

  /**
    * Only match for prefixed attributes
    *
    * @default false
    */
  prefixedOnly?: boolean

  /**
    * Support matching non-valued attributes
    *
    * For example
    * ```html
    * <div mt-2 />
    * ```
    *
    * @default true
    */
  nonValuedAttribute?: boolean

  /**
    * A list of attributes to be ignored from extracting.
    */
  ignoreAttributes?: string[]

  /**
    * Non-valued attributes will also match if the actual value represented in DOM is `true`.
    * This option exists for supporting frameworks that encodes non-valued attributes as `true`.
    * Enabling this option will break rules that ends with `true`.
    *
    * @default false
    */
  trueToNonValued?: boolean
}

const strippedPrefixes = [
  'v-bind:',
  ':',
]

const splitterRE = /[\s'"`;]+/g
const elementRE = /<\w(?=.*>)[\w:\.$-]*\s((?:['"`\{].*?['"`\}]|.*?)*?)>/gs
const valuedAttributeRE = /([?]|(?!\d|-{2}|-\d)[a-zA-Z0-9\u00A0-\uFFFF-_:!%-]+)(?:={?(["'])([^\2]*?)\2}?)?/g

export const defaultIgnoreAttributes = ['placeholder', 'setup', 'lang', 'scoped']

export default function transformerAttributify(options: TransformerAttributifyOptions = {}): SourceCodeTransformer {
  const ignoreAttributes = options?.ignoreAttributes ?? defaultIgnoreAttributes
  const nonValuedAttribute = options?.nonValuedAttribute ?? true
  const prefix = options.prefix ?? 'un-'
  const prefixedOnly = options.prefixedOnly ?? false

  return {
    name: 'transformer-attributify',
    enforce: 'pre',
    async transform(s, _) {
      const code = new MagicString(s.toString())
      Array.from(code.original.matchAll(elementRE))
        .forEach((match) => {
          const start = match.index!
          let matchStrTemp = match[0]
          let existsClass = ''
          const attrSelectors: string[] = []

          const valuedAttributes = Array.from((match[1] || '').matchAll(valuedAttributeRE))

          valuedAttributes.forEach(([matchStr, name, _, content]) => {
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
                  attrSelectors.push(_name)
                  matchStrTemp = matchStrTemp.replace(` ${_name}`, '')
                }
                return
              }

              if (['class', 'className'].includes(_name)) {
                if (!name.includes(':'))
                  existsClass = content
              }
              else {
                attrSelectors.push(...content
                  .split(splitterRE)
                  .filter(Boolean)
                  .map(v => v === '~' ? _name : `${_name}-${v}`))
                matchStrTemp = matchStrTemp.replace(` ${matchStr}`, '')
              }
            }
          })
          if (attrSelectors.length) {
            if (!existsClass) {
              code.overwrite(start, start + match[0].length, `${matchStrTemp.slice(0, -1)} class="${attrSelectors.join(' ')}"${matchStrTemp.slice(-1)}`)
            }
            else {
              matchStrTemp = matchStrTemp.replace(existsClass, `${existsClass} ${attrSelectors.join(' ')}`)
              code.overwrite(start, start + match[0].length, matchStrTemp)
            }
          }
        })
      s.overwrite(0, s.original.length, code.toString())
    },
  }
}
