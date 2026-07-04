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

  // `questionMark` rule's matcher — matches a bare `?` (and `where`) as a utility. Applet wxss
  // can't express its `:where`-style selector, and worse: UnoCSS's default extractor splits a
  // ternary (`true ? 1 : 0`) into tokens, so `?` enters `matched` and `transformerApplet`
  // rewrites it to `_a_`, corrupting script (#108). Removed by pattern rather than `pop()`,
  // since `pop()` relies on `questionMark` being the array's last entry — an upstream change
  // that appends another rule would silently leave it in place and reintroduce #108.
  // @see https://github.com/unocss/unocss/blob/main/packages-presets/preset-mini/src/_rules/default.ts
  const isQuestionMarkRule = (rule: unknown): boolean => {
    const pattern = Array.isArray(rule) ? rule[0] : rule
    return pattern instanceof RegExp && pattern.source === '^(where|\\?)$'
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
      // drop the `questionMark` rule (see `isQuestionMarkRule` above for why by-pattern, not `pop()`).
      preset.rules = preset.rules?.filter(rule => !isQuestionMarkRule(rule))
      // replace the built-in `variantSpaceAndDivide` (position 1): the upstream variant targets
      // `> * + *`, which applets can't express — applet needs an explicit element list
      // (`> view + view`, etc.). Inject the wildcard variant at the same time.
      preset.variants?.splice(1, 1, ...variantSpaceAndDivide(options), ...variantWildcard(options))
      // wind3 preflight reuses the mini-style preflightBase; applet controls variablePrefix/on-demand here
      preset.preflights = preflights(presetOptions)
    }
    else if (options.preset === 'wind4') {
      // applet can't express a universal selector: wind4's `property` preflight defaults its
      // selector to `*, ::before, ::after, ::backdrop` (scoped only by an `@supports` query).
      // Replace the `*` with `:not(not)` for parity with the wind3 #99 fix; merge with any
      // user-provided `preflights` so a user's `reset: false` / `theme` config is preserved.
      // @see https://github.com/unocss-applet/unocss-applet/issues/99
      const wind4Options = presetOptions as PresetWind4Options
      const userProperty = wind4Options.preflights?.property
      wind4Options.preflights = {
        ...wind4Options.preflights,
        // leave a user's explicit `property: false` untouched so they can still disable it
        ...(userProperty === false
          ? { property: false }
          : {
              property: {
                ...(typeof userProperty === 'object' ? userProperty : {}),
                selector: ':not(not), ::before, ::after, ::backdrop',
              },
            }),
      }

      preset = internalPresetWind4({ ...wind4Options })

      // drop the `questionMark` rule: same incompatibility as wind3 above.
      // @see https://github.com/unocss/unocss/blob/main/packages-presets/preset-wind4/src/rules/default.ts
      preset.rules = preset.rules?.filter(rule => !isQuestionMarkRule(rule))
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
      //
      // wind3 emits complex variants as a flat compound selector (e.g.
      // `.group[data-state=open] .group-data-\[state\=open\]\:font-bold`), so aliasing
      // `util.selector` is sufficient. wind4 restructures these into a nested form: the
      // original class moves into `util.parent` (used as the wrapping selector) and
      // `util.selector` becomes a relative `&:is(...)` body. Without aliasing `parent`,
      // the wrapping class keeps `\:` `\[` `\=` `\]` and is unreachable from applet wxss.
      // At-rules in `parent` (`@media`, `@supports`) carry raw `:`/`(`/`)` that are part
      // of their query, not class names; the double-escaped regex only matches the
      // backslash-escaped form, so it leaves those intact.
      postprocess: [
        (util) => {
          if (util.selector) {
            util.selector = replaceUnsupportedChars(util.selector)
            util.selector = encodeNonSpaceLatin(util.selector)
          }
          if (util.parent) {
            util.parent = replaceUnsupportedChars(util.parent)
            util.parent = encodeNonSpaceLatin(util.parent)
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
