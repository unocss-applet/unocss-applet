# 兼容性说明

本文件说明 `unocss-applet` 与上游 [UnoCSS](https://github.com/unocss/unocss) 各 preset / transformer / extractor 的兼容关系，并给出小程序端不可用时的替代或变通方案。

`unocss-applet` **不是** UnoCSS 的 fork，而是对 `@unocss/preset-wind3` / `@unocss/preset-wind4` 的包裹层。小程序端的兼容由两处配合实现：

- **`presetApplet` 的 postprocess**：在生成 CSS 时把选择器里的非法字符（`. : [ / % ! # ( ) ...`）替换为 `_a_`，并把非 ASCII（如中文）编码为字符码。
- **`transformerApplet`（由 `presetApplet` 自动注入）**：把源码模板里含非法字符的工具类（如 `py-3.5`、`bg-[url(...)]`）改写为 applet 安全别名，并注册为 shortcut 指回原始工具类。

两者闭环后，绝大多数 wind3/wind4 工具类可在小程序端正常使用。

## Presets 兼容矩阵

> 上游 preset 列表见 <https://github.com/unocss/unocss/tree/main/packages-presets>。

| 上游 Preset | 小程序端 | H5 端 | 说明与变通 |
| --- | :---: | :---: | --- |
| `preset-mini` | ✅ 包裹 | ✅ | 由 `presetApplet({ preset: 'wind3' })` 内部包含；无需单独使用。 |
| `preset-wind3` | ✅ 包裹 | ✅ | `presetApplet` 默认即基于 wind3，等价于 wind3。 |
| `preset-wind4` | ⚠️ 部分支持 | ✅ | `presetApplet({ preset: 'wind4' })`。wind4 的新语法（`text-[...]`、`c-*`、`border-*`、`rounded-1/2` 等）在 applet 下存在已知生成失败项，完整清单见 [`test/preset-applet-wind4.test.ts`](./test/preset-applet-wind4.test.ts) 的 `unmatched` 内联快照。**推荐使用 `wind3`**（默认）。 |
| [`preset-attributify`](https://unocss.dev/presets/attributify) | ❌ 不支持 | ✅ | 运行期依赖属性选择器 `[un-text=""]`，小程序 wxss 不支持。**变通**：小程序端改用本仓库 [`transformerAttributify`](./packages/transformer-attributify)，把属性编译进 `class=""`；H5 端仍用上游 `presetAttributify`。三套 example 均按此 if/else 分支配置。 |
| [`preset-tagify`](https://unocss.dev/presets/tagify) | ❌ 不支持 | ✅ | 生成 `<marker>` 标签选择器，小程序不支持自定义标签选择器。无内置变通。 |
| [`preset-icons`](https://unocss.dev/presets/icons) | ✅ 支持 | ✅ | 生成 `.i-xxx` 类名（`background-image` / `mask`），不依赖属性选择器。三套 example 均直接加载上游 `presetIcons`，无需额外处理。 |
| [`preset-typography`](https://unocss.dev/presets/typography) | ❌ 不支持 | ✅ | 重度使用 `:where` / `:is` / `:not` 与后代选择器，小程序不支持。无内置变通，建议手写 prose CSS 或使用 [`@unocss-applet/reset`](./packages/reset) 的 tailwind preflight。 |
| [`preset-web-fonts`](https://unocss.dev/presets/web-fonts) | ⚠️ 受限 | ✅ | 通过 `@import` / `@font-face` 引入外链字体，小程序对外链字体支持因平台而异（通常需 `wx.loadFontFace` 或本地字体）。H5 端正常。 |
| [`preset-rem-to-px`](https://unocss.dev/presets/rem-to-px) | ✅ | ✅ | 与本仓库 [`presetRemRpx`](./packages/preset-rem-rpx) 功能重叠。小程序端用 `presetRemRpx({ mode: 'rem2rpx' })`，H5 端用 `presetRemRpx({ mode: 'rpx2rem' })`，两端共用一份配置。 |
| [`preset-legacy-compat`](https://unocss.dev/presets/legacy-compat) | ✅ 支持 | ✅ | 纯兼容性规则（如逗号分隔颜色），不引入小程序不兼容的选择器，可叠加使用。 |
| `preset-uno` / `preset-wind`（deprecated） | — | — | 上游已废弃，本项目不涉及。 |

## Transformers 兼容矩阵

| Transformer | 小程序端 | H5 端 | 说明与变通 |
| --- | :---: | :---: | --- |
| [`transformer-variant-group`](https://unocss.dev/transformers/variant-group) | ✅ 支持 | ✅ | 纯源码展开（`foo-(bar baz)` → `foo-bar foo-baz`），输出标准 class，可被 `presetApplet` 的 postprocess 再处理。三套 example 未启用，但可放心叠加。 |
| [`transformer-directives`](https://unocss.dev/transformers/directives) | ❌ 不支持 | ✅ | `@apply` / `@screen` 在 UnoCSS 的 generator 上下文里无法把声明绑定到自定义选择器（`.foo { @apply p-2; }` 只产出 `.p-2{...}`，`.foo` 包裹丢失），且小程序构建链不注入 UnoCSS 插件层来补救；`@screen` / `theme()` 等则被静默丢弃。H5 端配合 UnoCSS Vite/Webpack 插件可用。 |
| [`transformer-compile-class`](https://unocss.dev/transformers/compile-class) | ⚠️ 需验证 | ✅ | 把 `:uno: xxx` 编译为 hash shortcut。hash 类名本身 applet 安全，但与 `transformerApplet` 叠加时需实际测试两者执行顺序与最终选择器是否符合预期。 |
| [`transformer-attributify-jsx`](https://unocss.dev/transformers/attributify-jsx) | ➡️ 不适用 | ➡️ 不适用 | 面向 JSX/TSX 的无值 attributify，依赖运行期 `presetAttributify`，小程序端不可用。uni-app（Vue3）与 Taro React（JSX/TSX）均使用本仓库 `transformerAttributify`（已支持 `.vue`/`.jsx`/`.tsx`，JSX 端注入 `className`）。 |
| 本仓库 `transformerAttributify` | ✅ 官方变通 | ➡️ 不需要 | 小程序端 Attributify 的官方实现，把 `.vue` / `.jsx` / `.tsx` 模板里的属性编译进 `class=""`（JSX 端注入 `className`）。 |

## Extractors

`extractor-pug` / `extractor-mdc` / `extractor-svelte` / `extractor-arbitrary-variants` 均面向特定模板语言（Pug / MDC / Svelte / 任意变体），与小程序（uni-app `.vue` / Taro 模板）无关，不适用。`presetApplet` 已通过 postprocess + transformer 覆盖了小程序模板的提取与改写。

## 推荐配置

三套 example 均采用统一的「小程序 / H5 分支」模式，可直接参照：

- [`examples/uni-app/uno.config.ts`](./examples/uni-app/uno.config.ts)
- [`examples/taro3/uno.config.ts`](./examples/taro3/uno.config.ts)
- [`examples/taro4/uno.config.ts`](./examples/taro4/uno.config.ts)

核心模式（以 uni-app 为例）：

```ts
const isApplet = process.env?.UNI_PLATFORM?.startsWith('mp-') ?? false

if (isApplet) {
  // 小程序端：presetApplet + rem2rpx + transformerAttributify（替代上游 presetAttributify）
  presets.push(presetApplet())
  presets.push(presetRemRpx()) // rem2rpx
  transformers.push(transformerAttributify({ ignoreAttributes: ['block'] }))
}
else {
  // H5 端：presetApplet + rpx2rem + 上游 presetAttributify（直接可用）
  presets.push(presetApplet())
  presets.push(presetRemRpx({ mode: 'rpx2rem' }))
  presets.push(presetAttributify())
}

// icons 两端通用，始终加载
presets.push(presetIcons({ scale: 1.2, warn: true, /* ... */ }))
```

**各段作用：**

| 配置项 | 小程序端 | H5 端 | 作用 |
| --- | --- | --- | --- |
| `presetApplet` | ✅ 必需 | ✅ 必需 | 包裹 wind3/wind4，注入 postprocess + transformerApplet，处理非法字符。 |
| `presetRemRpx` | `rem2rpx`（默认） | `rpx2rem` | 两端 rem/rpx 互转，共用一份样式。 |
| `transformerAttributify` | ✅ 必需（如需 attributify） | ❌ 不需要 | 小程序 attributify 变通方案，处理 `.vue` / `.jsx` / `.tsx`。 |
| `presetAttributify`（上游） | ❌ 不可用 | ✅ 必需 | H5 端 attributify 运行期支持。 |
| `presetIcons`（上游） | ✅ 可选 | ✅ 可选 | 图标，两端通用。 |

## 小程序端已知的非兼容点

除上表外，下列 wind3/wind4 工具类在小程序端**不生成**或行为不同，源于小程序本身的选择器/语法限制：

- `space-x-*` / `space-y-*` / `divide-*`：上游用 `> * + *`，applet 改写为枚举元素选择器（默认 `view`/`button`/`text`/`image`），可通过 `presetApplet({ betweenElements })` 自定义元素列表。
- `*:` 通配变体：上游 `> *` 在 applet 展开为枚举元素选择器（同上，可通过 `wildcardElements` 自定义）。
- wind4 新增的若干语法（见上文 wind4 行）。

## 伪类变体写法

结构性伪类（`:first-child` / `:last-child` / `:nth-child` 等）的变体名遵循上游 UnoCSS / Tailwind 的约定——**变体 key 与 CSS 伪类名并不相同**，这是上游 `PseudoClasses` 表决定的，并非小程序引入的不兼容。下表列出常用写法：

| 期望语义 | 正确写法 | 错误写法（不生成样式） |
| --- | --- | --- |
| `:first-child` / `:not(:first-child)` | `first:` / `not-first:` | ~~`first-child:` / `not-first-child:`~~ |
| `:last-child` / `:not(:last-child)` | `last:` / `not-last:` | ~~`last-child:` / `not-last-child:`~~ |
| `:only-child` / `:not(:only-child)` | `only-child:` / `not-only-child:` | ~~`only:` / `not-only:`~~ |
| `:first-of-type` / `:not(:first-of-type)` | `first-of-type:` / `not-first-of-type:` | |
| `:last-of-type` / `:not(:last-of-type)` | `last-of-type:` / `not-last-of-type:` | |
| `:only-of-type` / `:not(:only-of-type)` | `only-of-type:` / `not-only-of-type:` | |
| `:nth-child(2n)` 等 | `[&:nth-child(2n)]:`（任意值变体） | ~~`nth-child-2n:`~~ |

任意值形式 `[&:nth-child(2n)]:` 经 `_a_` 别名后在小程序端可用；其余变体同理。详见 [#52](https://github.com/unocss-applet/unocss-applet/issues/52)。
