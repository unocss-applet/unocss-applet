import type { SourceCodeTransformer } from '@unocss/core'
import type { TransformerAppletOptions } from './types'
import { escapeSelector } from '@unocss/core'

import { encodeNonSpaceLatin, UNSUPPORTED_CHARS } from '../../shared/src'

/**
 * Source-code transformer that makes applet-incompatible utilities usable in templates.
 *
 * Applet wxss can't reference class names containing `.`, `:`, `[`, `/`, ... , but such
 * tokens are common in UnoCSS (`py-3.5`, `dark:bg-red`, `bg-[url(...)]`). For each matched
 * utility this transformer:
 *   1. builds an applet-safe alias by replacing unsupported chars with `_a_` and encoding
 *      any non-ASCII (e.g. CJK) into char codes;
 *   2. registers the alias as a shortcut pointing back at the original utility, preserving
 *      its layer;
 *   3. rewrites the alias into the source so templates reference the applet-safe name.
 *
 * The paired postprocess in `presetApplet` then rewrites the generated CSS selector to match,
 * closing the loop. Only affects raw utility tokens in source text — attributify is handled
 * by `transformerAttributify`.
 */
export function transformerApplet(options: TransformerAppletOptions = {}): SourceCodeTransformer {
  const unsupportedChars = [...UNSUPPORTED_CHARS, ...(options.unsupportedChars ?? [])]
  const escapedUnsupportedChars = unsupportedChars.map(char => escapeSelector(char))
  const charTestReg = new RegExp(`[${escapedUnsupportedChars.join('')}]`)
  const charReplaceReg = new RegExp(`[${escapedUnsupportedChars.join('')}]`, 'g')
  // matches leading `-` of negative utilities (e.g. `-ml-1.5`); stripped before aliasing so
  // the minus isn't mistaken for an unsupported char and rewritten to `_a_`.
  const negativeReplaceReg = /^-+/

  return {
    name: 'transformer-applet',
    enforce: 'pre',
    async transform(s, _, ctx) {
      let code = s.toString()

      const { uno, tokens } = ctx
      const { matched } = await uno.generate(code, { preflights: false })

      // keep only utilities that actually contain unsupported chars; skip attributify-style
      // tokens (contain `=`) since those are owned by `transformerAttributify`. An exception
      // is made for `[url(` because the parentheses inside the url are unsupported chars
      // that must be aliased here.
      const replacements = Array.from(matched)
        .filter(i => charTestReg.test(i))
        .filter(i => !i.includes('=') || i.includes('[url('))

      for (let replace of replacements) {
        let replaced = replace.replace(charReplaceReg, '_a_')
        replaced = encodeNonSpaceLatin(replaced)

        // resolve the original utility once to read its layer, so the alias shortcut
        // preserves layering (e.g. `utilities` vs `shortcuts`) for correct CSS ordering
        const util = await uno.parseToken(replace)
        const layer = util?.[0]?.[4]?.layer

        // strip the leading `-` on both sides so the shortcut maps `ml-1_a_5` -> `ml-1.5`
        // (not `-ml-1_a_5` -> `-ml-1.5`); the minus is re-added by the negative variant,
        // keeping it out of the alias avoids it being rewritten to `_a_`.
        replace = replace.replace(negativeReplaceReg, '')
        replaced = replaced.replace(negativeReplaceReg, '')

        // register alias -> original as a shortcut; tokens.add ensures UnoCSS treats the
        // alias as a known token during extraction/scanning
        uno.config.shortcuts.push([replaced, replace, { layer }])
        tokens.add(replaced)

        code = code.replaceAll(replace, replaced)
      }

      s.overwrite(0, s.original.length, code)
    },
  }
}
