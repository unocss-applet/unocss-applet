import type { SourceCodeTransformer } from '@unocss/core'
import type { TransformerAttributifyOptions } from './types'
import { isValidSelector } from '@unocss/core'
import MagicString from 'magic-string'

export * from './types'

/**
 * Attributify mode for applets (uni-app / Taro on the mini-program side).
 *
 * Unlike upstream `@unocss/preset-attributify` — which works at runtime via attribute
 * selectors like `[un-text='']` — applets can't use attribute selectors in wxss. This
 * transformer instead compiles attributify usage in the template into plain `class="..."`
 * at build time, e.g. `<view text="red" mt-2 />` -> `<view class="text-red mt-2" />`.
 *
 * Scope: only `.vue` files (uni-app / Taro-vue templates). It is the official workaround for
 * attributify on the mini-program side; on H5 the upstream preset works directly.
 */
const splitterRE = /[\s'"`;]+/g
function genElementRE(ignoreTagPrefixes: string[] = []): RegExp {
  if (!ignoreTagPrefixes.length)
    // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/no-dupe-disjunctions
    return /<\w(?=.*>)[\w:.$-]*\s(((".*?>?.*?")|.*?)*?)\/?>/gs

  const patterns = ignoreTagPrefixes.flatMap((prefix) => {
    const baseLower = prefix.toLowerCase()
    const capitalized = baseLower.charAt(0).toUpperCase() + baseLower.slice(1)
    const hyphenated = `${baseLower}-`

    return [capitalized, hyphenated]
  })

  const ignorePattern = patterns.length ? `(?!${patterns.join('|')})` : ''
  return new RegExp(`<${ignorePattern}\\w(?=.*>)[\\w:.$-]*\\s(((".*?>?.*?")|.*?)*?)\\/?>`, 'gs')
}
// eslint-disable-next-line regexp/no-super-linear-backtracking
const attributeRE = /([[?\w\u00A0-\uFFFF-:()#%.\]]+)(?:\s*=\s*('[^']*'|"[^"]*"|\S+))?/g

const defaultIgnoreAttributes = ['placeholder', 'setup', 'lang', 'scoped']

export function transformerAttributify(options: TransformerAttributifyOptions = {}): SourceCodeTransformer {
  const ignoreAttributes = options?.ignoreAttributes ?? defaultIgnoreAttributes
  const nonValuedAttribute = options?.nonValuedAttribute ?? true
  const prefix = options.prefix ?? 'un-'
  const prefixedOnly = options.prefixedOnly ?? false
  const deleteAttributes = options.deleteAttributes ?? true
  const elementRE = genElementRE(options.ignoreTagPrefixes ?? [])

  return {
    name: 'transformer-attributify',
    enforce: 'pre',
    async transform(s, id, { uno }) {
      // only process Vue SFCs — the regex assumes Vue/uni-app template syntax
      if (!/\.vue$/.test(id))
        return

      const code = new MagicString(s.toString())

      const elementMatches = code.original.matchAll(elementRE)
      for (const eleMatch of elementMatches) {
        const start = eleMatch.index!
        let matchStrTemp = eleMatch[0]
        let existsClass = ''
        const attrSelectors: string[] = []
        const attributes = Array.from((eleMatch[1] || '').matchAll(attributeRE))

        for (const attribute of attributes) {
          const matchStr = attribute[0]
          const name = attribute[1]
          // skip Vue dynamic bindings (`:foo="..."`) — value is a JS expression, not utility tokens
          if (name.startsWith(':'))
            continue

          const content = attribute[2]

          const nonPrefixed = name.replace(prefix, '')
          if (!ignoreAttributes.includes(nonPrefixed)) {
            if (!content) {
              // non-valued attributes, e.g. `<div mt-2 />` -> class `mt-2`
              if (prefixedOnly && prefix && !name.startsWith(prefix))
                continue
              if (isValidSelector(nonPrefixed) && nonValuedAttribute) {
                // only keep it if UnoCSS actually recognises the token as a utility
                if (await uno.parseToken(nonPrefixed)) {
                  attrSelectors.push(nonPrefixed)
                  deleteAttributes && (matchStrTemp = matchStrTemp.replace(` ${name}`, ''))
                }
              }
            }
            else {
              // valued attributes, e.g. `<div text="red" p="2" />`
              if (name.includes('hover-class'))
                // `hover-class` is a native applet attribute, never an attributify target
                continue
              if (['class', 'className'].includes(name)) {
                // capture the existing class string so generated utilities can be appended to it;
                // ignore dynamic `:class` (handled by the `:` guard above) — here `name` is static
                if (!name.includes(':'))
                  existsClass = content.replace(/['"`]/g, '')
              }
              else {
                if (prefixedOnly && prefix && !name.startsWith(prefix))
                  continue

                const result: string[] = []

                for (const v of content.split(splitterRE).filter(Boolean)) {
                  let token = v
                  // value shorthand: b="~ green dark:red dark:2"
                  if (v.includes(':')) {
                    // variant-prefixed value, e.g. `dark:red` on `text` -> try `dark:text-red`
                    // first, fall back to the raw token if the prefix form isn't a utility
                    const splitV = v.split(':')
                    token = `${splitV[0]}:${splitV[1]}`
                    if (await uno.parseToken(`${nonPrefixed}-${splitV[1]}`))
                      result.push(`${splitV[0]}:${nonPrefixed}-${splitV[1]}`)
                    else if (await uno.parseToken(`${splitV[0]}:${splitV[1]}`))
                      result.push(`${splitV[0]}:${splitV[1]}`)
                  }
                  else {
                    // `~` references the attribute name itself (self shorthand);
                    // leading `!` is UnoCSS important modifier, kept in front of the composed token
                    if (v === '~')
                      token = nonPrefixed
                    else if (v.startsWith('!'))
                      token = `!${nonPrefixed}-${v.slice(1)}`
                    else
                      token = `${nonPrefixed}-${v}`
                    if (await uno.parseToken(token))
                      result.push(token)
                  }
                }

                attrSelectors.push(...result)
                result.length && deleteAttributes && (matchStrTemp = matchStrTemp.replace(` ${matchStr}`, ''))
              }
            }
          }
        }
        if (attrSelectors.length) {
          if (!existsClass) {
            // no prior class — inject one; account for self-closing `/>` vs `>`
            const sliceNum = matchStrTemp.endsWith('/>') ? -2 : -1
            matchStrTemp = `${matchStrTemp.slice(0, sliceNum)} class="${attrSelectors.join(' ')}"${matchStrTemp.slice(sliceNum)}`
          }
          else {
            // append generated utilities after the existing class value
            matchStrTemp = matchStrTemp.replace(`"${existsClass}"`, `"${existsClass} ${attrSelectors.join(' ')}"`)
          }
          code.overwrite(start, start + eleMatch[0].length, matchStrTemp)
        }
      }

      s.overwrite(0, s.original.length, code.toString())
    },
  }
}

export default transformerAttributify
