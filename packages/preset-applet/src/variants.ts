import type { Variant } from '@unocss/core'
import type { Theme } from '@unocss/preset-wind3'
import type { PresetAppletOptions } from './types'

/**
 * 上游 `variantSpaceAndDivide` 的小程序替代实现。
 *
 * 上游的 variant 会生成相邻兄弟选择器 `>:not([hidden])~:not([hidden])`，但小程序 wxss 解析不了，只能逐个列出
 * 内置组件。这里把 `space-x-*` / `space-y-*` / `divide-*` 改写成明确的目标元素列表——默认是
 * 最常用的四个小程序组件（`view`、`button`、`text`、`image`）——生成类似
 * `${input}>view+view,${input}>view+button,...` 的选择器。
 */
export function variantSpaceAndDivide(options: PresetAppletOptions): Variant<Theme>[] {
  const betweenElements = options?.betweenElements ?? ['view', 'button', 'text', 'image']

  return [
    (matcher) => {
      // `_*` 工具类是内部占位符，跳过
      if (matcher.startsWith('_'))
        return

      if (/space-[xy]-.+$/.test(matcher) || /divide-/.test(matcher)) {
        return {
          matcher,
          selector: (input) => {
            // 展开成元素列表里所有 (el + siblingEl) 的组合，这样不管子元素是哪个内置组件，
            // 间距都能生效
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
 * 为小程序展开 `*:` 通配变体。
 *
 * 上游的 `>` 通配选择器在小程序里没有对应写法，所以 `*:foo` 会被改写成列出同样的内置组件，
 * 比如 `>view,>button,>text,>image`——小程序的输出里不会出现 `page`（或 `*`）。
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
            // 去掉上游 variant 生成的末尾 `> *`（或 `>*`），再展开成明确的组件列表，
            // 让选择器在小程序 wxss 里能解析
            const newInput = input.replace(/\s?>\s?\*/g, '')
            const selectors = wildcardElements.map(el => `${newInput}>${el}`)
            return selectors.join(',')
          },
        }
      }
    },
  ]
}
