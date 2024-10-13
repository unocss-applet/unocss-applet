import type { Theme } from '@unocss/preset-uno'
import type { Variant } from 'unocss'
import type { PresetAppletOptions } from './types'

export function variantSpaceAndDivide(options: PresetAppletOptions): Variant<Theme>[] {
  const betweenElements = options?.betweenElements ?? ['view', 'button', 'text', 'image']

  return [
    (matcher) => {
      if (matcher.startsWith('_'))
        return

      if (/space-[xy]-.+$/.test(matcher) || /divide-/.test(matcher)) {
        return {
          matcher,
          selector: (input) => {
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
            const newInput = input.replace(/\s?>\s?\*/g, '')
            const selectors = wildcardElements.map(el => `${newInput}>${el}`)
            return selectors.join(',')
          },
        }
      }
    },
  ]
}
