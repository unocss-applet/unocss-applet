import type { Preflight, PreflightContext } from '@unocss/core'
import type { Theme } from '@unocss/preset-uno'
import { entriesToCss, toArray } from '@unocss/core'

export const appletPreflights: Preflight[] = [
  {
    layer: 'preflights',
    getCSS(ctx: PreflightContext<Theme>) {
      if (ctx.theme.preflightBase) {
        const css = entriesToCss(Object.entries(ctx.theme.preflightBase))
        const roots = toArray(ctx.theme.preflightRoot ?? ['page,::before,::after', '::backdrop'])
        return roots.map(root => `${root}{${css}}`).join('')
      }
    },
  },
]
