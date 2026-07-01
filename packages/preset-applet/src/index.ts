import type { Preset } from '@unocss/core'
import type { PresetWind3Options } from '@unocss/preset-wind3'
import type { PresetWind4Options } from '@unocss/preset-wind4'
import type { PresetAppletOptions } from './types'
import { definePreset, escapeSelector } from '@unocss/core'
import { presetWind3 as internalPresetWind3 } from '@unocss/preset-wind3'
import { presetWind4 as internalPresetWind4 } from '@unocss/preset-wind4'
import { encodeNonSpaceLatin, UNSUPPORTED_CHARS } from '../../shared/src'
import { preflights } from './preflights'
import { transformerApplet } from './transformers'
import { variantSpaceAndDivide, variantWildcard } from './variants'

export * from './types'

export function presetApplet(options: PresetAppletOptions = {}): Preset<object> {
  options.preset = options.preset ?? 'wind3'
  const unsupportedChars = [...UNSUPPORTED_CHARS, ...(options.unsupportedChars ?? [])]
  // postprocess receives a selector already escaped once by UnoCSS (e.g. `.` -> `\.`),
  // so building a regex to match those chars requires escaping a second time; a single
  // escape would leave the regex matching the literal backslash instead of the source char.
  const escapedUnsupportedChars = unsupportedChars.map(char => escapeSelector(escapeSelector(char)))
  const charTestReg = new RegExp(`${escapedUnsupportedChars.join('|')}`)
  const charReplaceReg = new RegExp(charTestReg, 'g')

  function replaceUnsupportedChars(str: string): string {
    if (charTestReg.test(str))
      str = str.replace(charReplaceReg, '_a_')
    return str
  }

  return definePreset((presetOptions: PresetWind3Options | PresetWind4Options = {}) => {
    presetOptions = options.presetOptions ?? {}
    presetOptions.dark = presetOptions.dark ?? 'class'
    presetOptions.attributifyPseudo = presetOptions.attributifyPseudo ?? false
    presetOptions.preflight = presetOptions.preflight ?? true
    presetOptions.variablePrefix = presetOptions.variablePrefix ?? 'un-'

    let preset

    if (options.preset === 'wind3') {
      preset = internalPresetWind3({ ...(presetOptions as PresetWind3Options) })
      // drop the trailing `questionMark` rule: it generates attribute/`:where`-style selectors
      // that the applet wxss engine cannot express.
      // @see https://github.com/unocss/unocss/blob/main/packages-presets/preset-mini/src/_rules/default.ts
      preset.rules?.pop()
      // replace the built-in `variantSpaceAndDivide` (position 1): the upstream variant targets
      // `> * + *`, which applets can't express — applet needs an explicit element list
      // (`> view + view`, etc.). Inject the wildcard variant at the same time.
      preset.variants?.splice(1, 1, ...variantSpaceAndDivide(options), ...variantWildcard(options))
      // wind3 preflight reuses the mini-style preflightBase; applet controls variablePrefix/on-demand here
      preset.preflights = preflights(presetOptions)
    }
    else if (options.preset === 'wind4') {
      preset = internalPresetWind4({ ...(presetOptions as PresetWind4Options) })

      // drop the trailing `questionMark` rule: same incompatibility as wind3 above.
      // @see https://github.com/unocss/unocss/blob/main/packages-presets/preset-wind4/src/rules/default.ts
      preset.rules?.pop()
      // wind4 ships its own reset/theme/property preflights (trackedTheme/trackedProperties);
      // keep them as-is — overriding with the wind3-style preflight would drop them all.
    }

    return {
      ...preset,
      name: 'unocss-preset-applet',
      // postprocess rewrites each generated selector so it is applet-safe:
      //   1. replace unsupported chars (`.`, `:`, `[`, ...) with `_a_`
      //   2. encode any non-ASCII (e.g. CJK) into char codes, since applet class names
      //      must match `[A-Za-z0-9_-]`
      // This runs after UnoCSS has resolved rules, so it covers everything wind3/wind4 emit.
      postprocess: [
        (util) => {
          if (util.selector) {
            util.selector = replaceUnsupportedChars(util.selector)
            util.selector = encodeNonSpaceLatin(util.selector)
          }
          return util
        },
      ],
      configResolved(config) {
        // auto-register the source-code transformer so users only need to add this preset;
        // the transformer aliases unsupported tokens in the source into applet-safe class names
        // and registers them as shortcuts so they resolve back to the original utilities.
        if (!config.transformers)
          config.transformers = []
        config.transformers.push(transformerApplet(options))
      },
    }
  },
  )
}

export default presetApplet

export { transformerApplet }
