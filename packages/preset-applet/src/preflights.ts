import type { Preflight } from '@unocss/core'
import type { PresetMiniOptions, Theme } from '@unocss/preset-mini'

import { entriesToCss, toArray } from '@unocss/core'

/**
 * Builds the wind3-style preflight for applets.
 *
 * Re-implemented here (rather than reusing the upstream preflight) so applet can control two
 * things independently: the CSS variable prefix (`variablePrefix`) and on-demand emission
 * (`preflight: 'on-demand'`), which keeps only base rules referenced by activated utilities.
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
              // only emit base entries whose key is referenced by an activated rule, so
              // unused preflight CSS isn't shipped to the applet bundle
              const keys = new Set(Array.from(generator.activatedRules).map(r => r[2]?.custom?.preflightKeys).filter(Boolean).flat())
              entries = entries.filter(([k]) => keys.has(k))
            }

            if (entries.length > 0) {
              let css = entriesToCss(entries)
              // remap the hard-coded `--un-` vars to the configured prefix so downstream
              // utilities referencing the prefix resolve correctly
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
