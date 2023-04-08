import type { SourceCodeTransformer } from 'unocss'
import type { TransformerAppletOptions } from './types'

export * from './types'

export default function transformerApplet(options: TransformerAppletOptions = {}): SourceCodeTransformer {
  const enable = options.enable ?? true
  const layer = options.layer || 'applet_shortcuts'

  const UNSUPPORTED_CHARS = ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$']
  if (options.unsupportedChars)
    UNSUPPORTED_CHARS.push(...options.unsupportedChars)

  const ESCAPED_UNSUPPORTED_CHARS = UNSUPPORTED_CHARS.map(char => `\\${char}`)
  const charTestReg = new RegExp(`[${ESCAPED_UNSUPPORTED_CHARS.join('')}]`)
  const charReplaceReg = new RegExp(`[${ESCAPED_UNSUPPORTED_CHARS.join('')}]`, 'g')

  return {
    name: 'transformer-applet',
    enforce: 'pre',
    async transform(s, id, ctx) {
      let code = s.toString()
      if (!enable)
        return

      const { uno, tokens } = ctx
      const { matched } = await uno.generate(code.toString(), { preflights: false })
      const replacements = Array.from(matched).filter(i => charTestReg.test(i))
      for (const replace of replacements) {
        const replaced = replace.replace(charReplaceReg, '_a_')
        uno.config.shortcuts.push([replaced, replace, { layer }])
        tokens.add(replaced)
        code = code.replaceAll(replace, replaced)
      }

      s.overwrite(0, s.original.length, code)
    },
  }
}
