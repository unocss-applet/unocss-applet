import type { Variant } from 'unocss'
import type { Theme } from '@unocss/preset-uno'
import type { PresetAppletOptions } from './types'

export function variantSpaceAndDivide(options: PresetAppletOptions): Variant<Theme>[] {
  const betweenElements = options?.betweenElements ?? ['view', 'button', 'text', 'image']

  return [
    (matcher) => {
      if (matcher.startsWith('_'))
        return

      if (/space-?([xy])-?(-?.+)$/.test(matcher) || /divide-/.test(matcher)) {
        return {
          matcher,
          selector: (input) => {
            const selectors = betweenElements.map(el => `${input}>${el}+${el}`)
            return selectors.join(',')
          },
        }
      }
    },
  ]
}
