import type { SourceCodeTransformer } from '@unocss/core'
import type { TransformerAppletOptions } from './types'
import { escapeSelector } from '@unocss/core'

import { encodeNonSpaceLatin, UNSUPPORTED_CHARS } from '../../shared/src'

export function transformerApplet(options: TransformerAppletOptions = {}): SourceCodeTransformer {
  const unsupportedChars = [...UNSUPPORTED_CHARS, ...(options.unsupportedChars ?? [])]
  const escapedUnsupportedChars = unsupportedChars.map(char => escapeSelector(char))
  const charTestReg = new RegExp(`[${escapedUnsupportedChars.join('')}]`)
  const charReplaceReg = new RegExp(`[${escapedUnsupportedChars.join('')}]`, 'g')
  const negativeReplaceReg = /^-+/

  return {
    name: 'transformer-applet',
    enforce: 'pre',
    async transform(s, _, ctx) {
      let code = s.toString()

      const { uno, tokens } = ctx
      const { matched } = await uno.generate(code, { preflights: false })

      // skip attributify
      const replacements = Array.from(matched)
        .filter(i => charTestReg.test(i))
        .filter(i => !i.includes('=') || i.includes('[url('))

      for (let replace of replacements) {
        let replaced = replace.replace(charReplaceReg, '_a_')
        replaced = encodeNonSpaceLatin(replaced)

        // get original layer
        const util = await uno.parseToken(replace)
        const layer = util?.[0]?.[4]?.layer

        // delete all - prefix
        replace = replace.replace(negativeReplaceReg, '')
        replaced = replaced.replace(negativeReplaceReg, '')

        uno.config.shortcuts.push([replaced, replace, { layer }])
        tokens.add(replaced)

        code = code.replaceAll(replace, replaced)
      }

      s.overwrite(0, s.original.length, code)
    },
  }
}
