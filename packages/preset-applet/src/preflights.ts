import type { Preflight } from '@unocss/core'
import type { PresetMiniOptions, Theme } from '@unocss/preset-mini'

import { entriesToCss, toArray } from '@unocss/core'

/**
 * 为小程序构建 wind3 风格的 preflight。
 *
 * 没有直接复用上游的 preflight，而是重新实现，是为了让小程序端能独立控制两件事：CSS 变量
 * 前缀（`variablePrefix`），以及按需产出（`preflight: 'on-demand'`，只保留被已激活工具类
 * 引用到的 base 规则）。
 */
export function preflights(options: PresetMiniOptions): Preflight<Theme>[] | undefined {
  if (options.preflight) {
    return [
      {
        layer: 'preflights',
        getCSS({ theme, generator }) {
          if (theme.preflightBase) {
            let entries = Object.entries(theme.preflightBase)
            if (options.preflight === 'on-demand') {
              // 只输出 key 被已激活规则引用到的 base 条目，没用到的 preflight CSS 不会
              // 被打进小程序包里
              const keys = new Set(Array.from(generator.getActivatedRules()).map(r => r[2]?.custom?.preflightKeys).filter(Boolean).flat())
              entries = entries.filter(([k]) => keys.has(k))
            }

            if (entries.length > 0) {
              let css = entriesToCss(entries)
              // 把写死的 `--un-` 变量重映射成配置的前缀，让下游引用该前缀的工具类能正确解析
              if (options.variablePrefix !== 'un-') {
                css = css.replace(/--un-/g, `--${options.variablePrefix}`)
              }
              const roots = toArray(theme.preflightRoot ?? [':not(not),::before,::after', '::backdrop'])
              return roots.map(root => `${root}{${css}}`).join('')
            }
          }
        },
      },
    ]
  }
}
