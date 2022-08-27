import type { SourceCodeTransformer } from 'unocss'
import MagicString from 'magic-string'
import type { TransformerAppletOptions } from './types'
import { compileApplet } from './compile'

export default function transformerApplet(options: TransformerAppletOptions = {}): SourceCodeTransformer {
  // Regular expression of characters to be escaped
  const charReg = /[.:%!#()[\/\],]/

  const classRE = /:?(hover-)?class=\".*?\"/g
  const string1RE = /([']).*?(['])/g
  const string2RE = /([\`]).*?([\`])/g

  return {
    name: 'transformer-applet',
    enforce: 'pre',
    async transform(s, _, ctx) {
      const code = new MagicString(s.toString())
      // process class
      const classMatches = [...code.original.matchAll(classRE)]
      for (const match of classMatches) {
        // skip `... ? ... : ...`
        if (/\?.*:/g.test(match[0]))
          continue

        // skip `... : ...`
        if (/{.+:.+}/g.test(match[0]))
          continue

        const start = match.index!
        const matchSplit = match[0].split('class=')

        const body = matchSplit[1].slice(1, -1)

        if (charReg.test(body)) {
          const replacements = await compileApplet(body, ctx, options)
          code.overwrite(start, start + match[0].length, `${matchSplit[0]}class="${replacements.join(' ')}"`)
        }
      }

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

