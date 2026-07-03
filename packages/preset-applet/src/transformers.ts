import type { SourceCodeTransformer } from '@unocss/core'
import type { TransformerAppletOptions } from './types'
import { escapeRegExp, escapeSelector } from '@unocss/core'

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
      const { uno, tokens } = ctx
      const { matched } = await uno.generate(s.toString(), { preflights: false })

      // keep only utilities that actually contain unsupported chars; skip attributify-style
      // tokens (contain `=`) since those are owned by `transformerAttributify`. An exception
      // is made for `[url(` because the parentheses inside the url are unsupported chars
      // that must be aliased here.
      const replacements = Array.from(matched)
        .filter(i => charTestReg.test(i))
        .filter(i => !i.includes('=') || i.includes('[url('))
        // #109: on bare-text templates like `<text>...translate--1/2</text>`, the extractor
        // pulls in tokens with HTML tag chars bleed-through (e.g. `translate--1/2</text>`).
        // Aliasing those corrupts the source; `<`/`>` never appear in a real class token, so
        // reject them outright. Blacklist (not a whitelist) on purpose — a whitelist would
        // need to enumerate every char legit tokens may use (`!`, `#`, `.`, `/`, ...), and
        // would silently drop utilities when UnoCSS adds new token forms later.
        .filter(i => !/[<>]/.test(i))
        // longest first so a token that contains another as a substring (e.g. `dark:p-2.5`
        // contains bare `p-2.5`) claims its full span first; otherwise the inner `p-2.5`
        // would win and the outer token's alias would never be written into the source,
        // leaving an applet-invalid class like `dark:p-2_a_5` (still has `:`).
        .sort((a, b) => b.length - a.length)

      // claimed source ranges; any later match overlapping one of these is skipped. This
      // single array serves two purposes: (1) comment spans seeded just below, so utilities
      // inside comments aren't rewritten; (2) ranges already overwritten in the loop, since
      // magic-string throws on overlapping overwrites and this also keeps the longest-first
      // invariant above correct regardless of insertion order.
      const claimed: [number, number][] = []
      // #109: pre-seed with comment spans so utilities appearing inside comments are
      // skipped — the boundary regex below can't tell a comment from a class list, and
      // rewriting `<!-- p-2.5 -->` to `<!-- p-2_a_5 -->` corrupts source text. String
      // literals are deliberately NOT skipped: dynamic class bindings
      // (`:class="'p-2.5 ' + x"`) must be rewritten so the runtime class matches the
      // `_a_`-aliased wxss selector.
      //
      // Only block (`/* */`) and HTML (`<!-- -->`) comments are matched — `//` line
      // comments are intentionally excluded: the `//` in `https://`, regex literals, and
      // paths is indistinguishable from a real line comment to a stateless regex, and
      // matching it would swallow the tail of any URL utility (e.g. `bg-[url(...)]`),
      // which is a far more common applet case than a class written in a `//` comment.
      const commentReg = /\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g
      for (const m of s.original.matchAll(commentReg))
        claimed.push([m.index!, m.index! + m[0].length])

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

        // match each utility as a standalone token — the lookbehind/lookahead on
        // `[A-Za-z0-9_]` prevents partial matches (e.g. `p-2.5` inside `p-2.55`).
        // operate against the immutable `s.original` so offsets stay valid across tokens.
        // NOTE: `replace` here is already stripped of its leading `-` (see above), so for a
        // negative utility like `-ml-1.5` this matches the `ml-1.5` span and overwrites it
        // with the similarly-stripped alias — the leading `-` stays put in the source and is
        // re-emitted by the negative variant at CSS-gen time.
        const boundaryReg = new RegExp(`(?<![A-Za-z0-9_])${escapeRegExp(replace)}(?![A-Za-z0-9_])`, 'g')
        for (const m of s.original.matchAll(boundaryReg)) {
          const start = m.index!
          const end = start + replace.length
          if (claimed.some(([cs, ce]) => start < ce && end > cs))
            continue
          s.overwrite(start, end, replaced)
          claimed.push([start, end])
        }
      }
    },
  }
}
