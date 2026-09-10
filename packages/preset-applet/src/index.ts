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
  // postprocess 拿到的 selector 已经被 UnoCSS 转义过一次（比如 `.` 变成 `\.`），
  // 所以要构建一个能匹配这些字符的正则，得再转义一次；只转义一次的话，正则匹配到的
  // 会是字面上的反斜杠，而不是原始字符。
  const escapedUnsupportedChars = unsupportedChars.map(char => escapeSelector(escapeSelector(char)))
  const charTestReg = new RegExp(`${escapedUnsupportedChars.join('|')}`)
  const charReplaceReg = new RegExp(charTestReg, 'g')

  function replaceUnsupportedChars(str: string): string {
    if (charTestReg.test(str))
      str = str.replace(charReplaceReg, '_a_')
    return str
  }

  // `questionMark` 规则的 matcher —— 它会把单独的 `?`（还有 `where`）当作工具类。小程序
  // wxss 写不出它需要的 `:where` 类选择器，更麻烦的是 UnoCSS 默认 extractor 会把三元表达式
  // （`true ? 1 : 0`）拆成 token，`?` 就进了 `matched`，`transformerApplet` 会把它改写成
  // `_a_`，直接损坏脚本代码（#108）。这里按 pattern 匹配来删，而不是用 `pop()`：`pop()`
  // 依赖 `questionMark` 恰好是数组最后一项，万一上游往后追加了新规则，`pop()` 会漏删，
  // #108 就悄悄回来了。
  // @see https://github.com/unocss/unocss/blob/main/packages-presets/preset-mini/src/_rules/question-mark.ts
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
      // 删掉 `questionMark` 规则（为什么按 pattern 匹配而不是 `pop()`，见上面 `isQuestionMarkRule` 的注释）。
      preset.rules = preset.rules?.filter(rule => !isQuestionMarkRule(rule))
      // 替换内置的 `variantSpaceAndDivide`（位置 1）：上游 variant 生成的是相邻兄弟选择器
      // `>:not([hidden])~:not([hidden])`，小程序 wxss 解析不了，只能改成明确的元素列表
      // （`> view + view` 这类）。顺手在这里注入 wildcard variant。
      preset.variants?.splice(1, 1, ...variantSpaceAndDivide(options), ...variantWildcard(options))
      // wind3 的 preflight 复用 mini 风格的 preflightBase；variablePrefix 和按需生成由 applet 在这里控制
      preset.preflights = preflights(presetOptions)
    }
    else if (options.preset === 'wind4') {
      // 小程序写不出通配选择器：wind4 的 `property` preflight 默认 selector 是
      // `*, ::before, ::after, ::backdrop`（只靠一条 `@supports` 查询限定范围）。
      // 把 `*` 换成 `:not(not)`，和 wind3 的 #99 修复保持一致；同时合并用户自己配的
      // `preflights`，用户的 `reset: false` / `theme` 配置不会丢。
      // @see https://github.com/unocss-applet/unocss-applet/issues/99
      const wind4Options = presetOptions as PresetWind4Options
      const userProperty = wind4Options.preflights?.property
      wind4Options.preflights = {
        ...wind4Options.preflights,
        // 用户明确写了 `property: false` 就不动，保留关闭它的能力
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

      // 删掉 `questionMark` 规则：原因和上面 wind3 一样。
      // @see https://github.com/unocss/unocss/blob/main/packages-presets/preset-wind4/src/rules/question-mark.ts
      preset.rules = preset.rules?.filter(rule => !isQuestionMarkRule(rule))
      // wind4 自带 reset/theme/property preflights（trackedTheme/trackedProperties）；
      // 保持原样——用 wind3 风格的 preflight 覆盖会把它们全丢掉。
    }

    return {
      ...preset,
      name: 'unocss-preset-applet',
      // postprocess 把每条生成的 selector 改写成小程序能用的形式：
      //   1. 把不支持字符（`.`、`:`、`[` 等）替换为 `_a_`
      //   2. 把非 ASCII 字符（比如中文）编码成字符码，因为小程序类名只能匹配
      //      `[A-Za-z0-9_-]`
      // 它在 UnoCSS 解析完规则之后运行，所以 wind3/wind4 产出的所有选择器都会被覆盖到。
      //
      // wind3 把复杂 variant 生成成一个扁平的复合 selector（比如
      // `.group[data-state=open] .group-data-\[state\=open\]\:font-bold`），所以只处理
      // `util.selector` 就够了。wind4 会把它重构成嵌套形式：原始类名挪进 `util.parent`
      // （用作外层包裹 selector），`util.selector` 变成相对的 `&:is(...)` 主体。不处理
      // `parent` 的话，外层类名会留着 `\:` `\[` `\=` `\]`，小程序 wxss 里引用不到。
      // `parent` 里的 at-rule（`@media`、`@supports`）本身带有原始的 `:`/`(`/`)`，
      // 那些是查询语法的一部分，不是类名；双重转义的正则只匹配反斜杠转义后的形式，
      // 所以不会误伤它们。
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
        // 自动注册 source-code transformer，用户只要加这个 preset 就行；transformer 负责
        // 把源码里含不支持字符的 token 改写成小程序安全的类名，并注册成 shortcut
        // 指回原始工具类。
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
