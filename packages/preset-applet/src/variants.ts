import type { Variant } from '@unocss/core'
import type { Theme } from '@unocss/preset-wind3'
import type { PresetAppletOptions } from './types'

/**
 * Applet replacement for the upstream `variantSpaceAndDivide`.
 *
 * The upstream variant emits `> * + *` to space sibling children, but applets have no
 * universal selector and only enumerate specific built-in components. This rewrites
 * `space-x-*` / `space-y-*` / `divide-*` to target an explicit element list — by default
 * the four common applet building blocks (`view`, `button`, `text`, `image`) — producing
 * selectors like `${input}>view+view,${input}>view+button,...`.
 */
export function variantSpaceAndDivide(options: PresetAppletOptions): Variant<Theme>[] {
  const betweenElements = options?.betweenElements ?? ['view', 'button', 'text', 'image']

  return [
    (matcher) => {
      // `_*` utilities are internal placeholders; skip them
      if (matcher.startsWith('_'))
        return

      if (/space-[xy]-.+$/.test(matcher) || /divide-/.test(matcher)) {
        return {
          matcher,
          selector: (input) => {
            // expand to every (el + siblingEl) pair across the element list, so spacing
            // applies regardless of which built-in component a child happens to be
            const selectors = betweenElements.map((el) => {
              const res: string[] = []
              betweenElements.forEach((e) => {
                res.push(`${input}>${el}+${e}`)
              })
              return res.join(',')
            })
            return selectors.join(',')
          },
        }
      }
    },
  ]
}

/**
 * Expands the `*:` wildcard variant for applets.
 *
 * The upstream `>` universal selector has no applet equivalent, so `*:foo` is rewritten to
 * enumerate the same built-in element list, e.g. `>view,>button,>text,>image`. This is why
 * applet output never contains `page` (or `*`) — the README's "Change" section documents this.
 */
export function variantWildcard(options: PresetAppletOptions): Variant<Theme>[] {
  const wildcardElements = options?.wildcardElements ?? ['view', 'button', 'text', 'image']

  return [
    (matcher) => {
      if (matcher.startsWith('_'))
        return

      if (/\*:.*/.test(matcher)) {
        return {
          matcher,
          selector: (input) => {
            // drop the trailing `> *` (or `>*`) the upstream variant produced, then fan out
            // to the explicit element list so the selector resolves in applet wxss
            const newInput = input.replace(/\s?>\s?\*/g, '')
            const selectors = wildcardElements.map(el => `${newInput}>${el}`)
            return selectors.join(',')
          },
        }
      }
    },
  ]
}
