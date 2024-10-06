import type { SourceCodeTransformer } from '@unocss/core'
import { UNSUPPORTED_CHARS, encodeNonSpaceLatin } from '@unocss-applet/shared'

export interface TransformerAppletOptions {

  /**
   * Unsupported characters in applet, will be added to the default value
   * @default ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$', '{', '}', '@', '+', '^', '&', '<', '>', '\'', '\\', '"', '?', '*', '=']
   */
  unsupportedChars?: string[]
}

export function transformerApplet(options: TransformerAppletOptions = {}): SourceCodeTransformer {
  const _UNSUPPORTED_CHARS = [...UNSUPPORTED_CHARS, ...(options.unsupportedChars ?? [])]
  const ESCAPED_UNSUPPORTED_CHARS = _UNSUPPORTED_CHARS.map(char => `\\${char}`)
  const charTestReg = new RegExp(`[${ESCAPED_UNSUPPORTED_CHARS.join('')}]`)
  const charReplaceReg = new RegExp(`[${ESCAPED_UNSUPPORTED_CHARS.join('')}]`, 'g')
  const negativeReplaceReg = /^-+/

  return {
    name: 'transformer-applet',
    enforce: 'pre',
    async transform(s, _, ctx) {
      let code = s.toString()

      const { uno, tokens } = ctx
      const { matched, layers } = await uno.generate(code, { preflights: false })

      // skip attributify
      const replacements = Array.from(matched)
        .filter(i => charTestReg.test(i))
        .filter(i => !i.includes('=') || i.includes('[url('))

      for (let replace of replacements) {
        let replaced = replace.replace(charReplaceReg, '_a_')
        replaced = encodeNonSpaceLatin(replaced)

        // delete all - prefix
        replace = replace.replace(negativeReplaceReg, '')
        replaced = replaced.replace(negativeReplaceReg, '')

        uno.config.shortcuts.push([replaced, replace, { layer: layers[0] }])
        tokens.add(replaced)

        code = code.replaceAll(replace, replaced)
      }

      s.overwrite(0, s.original.length, code)
    },
  }
}
