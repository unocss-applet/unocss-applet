import type { SourceCodeTransformer } from 'unocss'
import { UNSUPPORTED_CHARS, encodeNonLatin } from '../../shared/src'

export interface TransformerAppletOptions {
  /**
   * The layer name of generated rules
   * @default 'applet_shortcuts'
   */
  layer?: string

  /**
   * Unsupported characters in applet, will be added to the default value
   * @default ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$', '{', '}', '@', '+', '^', '&', '<', '>', '\'']
   */
  unsupportedChars?: string[]
}

export default function transformerApplet(options: TransformerAppletOptions = {}): SourceCodeTransformer {
  const layer = options.layer ?? 'applet_shortcuts'

  const _UNSUPPORTED_CHARS = [...UNSUPPORTED_CHARS, ...(options.unsupportedChars ?? [])]
  const ESCAPED_UNSUPPORTED_CHARS = _UNSUPPORTED_CHARS.map(char => `\\${char}`)
  const charTestReg = new RegExp(`[${ESCAPED_UNSUPPORTED_CHARS.join('')}]`)
  const charReplaceReg = new RegExp(`[${ESCAPED_UNSUPPORTED_CHARS.join('')}]`, 'g')

  return {
    name: 'transformer-applet',
    enforce: 'post',
    async transform(s, id, ctx) {
      let code = s.toString()

      const { uno, tokens } = ctx
      const { matched } = await uno.generate(code, { preflights: false })
      // skip attributify
      const replacements = Array.from(matched).filter(i => charTestReg.test(i))
        .filter(i => !i.includes('='))
      for (const replace of replacements) {
        let replaced = replace.replace(charReplaceReg, '_a_')
        replaced = encodeNonLatin(replaced)

        // delete all - prefix
        while (replaced.startsWith('-'))
          replaced = replaced.slice(1)

        uno.config.shortcuts.push([replaced, replace, { layer }])
        tokens.add(replaced)

        // escapeRegExp replace, node v14 not support replaceAll
        code = code.replace(new RegExp(escapeRegExp(replace), 'g'), replaced)
      }

      s.overwrite(0, s.original.length, code)
    },
  }
}

function escapeRegExp(string: string) {
  return string.replace(/[.:%!#()[\]/,${}@+^&<>]/g, '\\$&')
}
