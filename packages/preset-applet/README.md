# @unocss-applet/preset-applet

[UnoCSS](https://github.com/unocss/unocss) 的小程序预设，包裹 [`@unocss/preset-wind3`](https://github.com/unocss/unocss/tree/main/packages-presets/preset-wind3)（默认）/ [`@unocss/preset-wind4`](https://github.com/unocss/unocss/tree/main/packages-presets/preset-wind4)，对部分 CSS 选择器做转换以兼容小程序。

`presetApplet` 会自动注入 `transformerApplet`：把源码里含非法字符的工具类改写为英文名称别名，让模板里的类名与生成的 wxss 选择器对得上。改写范围有明确边界（见下文「源码改写规则」），不会碰 JS 代码。

## 安装

```bash
npm i @unocss-applet/preset-applet --save-dev # with npm
yarn add @unocss-applet/preset-applet -D # with yarn
pnpm add @unocss-applet/preset-applet -D # with pnpm
```

## 使用

```ts
import { presetApplet } from '@unocss-applet/preset-applet'
import { defineConfig } from 'unocss'

export default defineConfig({
  presets: [
    presetApplet(),
  ],
})
```

## 类型声明

```ts
// PresetWind3Options https://github.com/unocss/unocss/blob/main/packages-presets/preset-wind3/src/index.ts
// PresetWind4Options https://github.com/unocss/unocss/blob/main/packages-presets/preset-wind4/src/index.ts
export interface PresetAppletOptions {
  /**
   * 上游预设，wind3（默认）或 wind4
   * @default 'wind3'
   */
  preset?: 'wind3' | 'wind4'

  /**
   * 传给上游 wind3 / wind4 的选项
   */
  presetOptions?: PresetWind3Options | PresetWind4Options

  /**
   * 额外的不支持字符，会合并进默认值
   * @default ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$', '{', '}', '@', '+', '^', '&', '<', '>', '\'', '\\', '"', '?', '*', '=']
   */
  unsupportedChars?: string[]

  /**
   * Space Between / Divide Width 作用的元素列表
   * @default ['view', 'button', 'text', 'image']
   */
  betweenElements?: string[]

  /**
   * 通配符 `*:` 变体展开的元素列表
   * @default ['view', 'button', 'text', 'image']
   */
  wildcardElements?: string[]
}
```

## 与上游的差异

- `space-x-*` / `space-y-*` / `divide-*`：上游用 `> * + *`，applet 改写为枚举元素选择器（默认 `view`/`button`/`text`/`image`，可通过 `betweenElements` 自定义）。
- `*:` 通配变体：上游 `> *` 在 applet 展开为枚举元素选择器（同上，可通过 `wildcardElements` 自定义）。
- 类名中的不支持字符（`. : [ / % ! # ( ) ...`）按英文名称编码为 `_<名称>_`，使生成的选择器在 applet wxss 中可引用。比如 `w-1/2` 变成 `w-1_slash_2`，`w-1.2` 变成 `w-1_dot_2`，两种宽度不会再共用一个类名。

所有内置不支持字符使用不同的固定名称：

| 符号 | 名称 | 符号 | 名称 |
| --- | --- | --- | --- |
| `.` | `dot` | `:` | `colon` |
| `%` | `percent` | `!` | `exclamation` |
| `#` | `hash` | `/` | `slash` |
| `(` | `lparen` | `)` | `rparen` |
| `[` | `lbracket` | `]` | `rbracket` |
| `{` | `lbrace` | `}` | `rbrace` |
| `,` | `comma` | `$` | `dollar` |
| `@` | `at` | `+` | `plus` |
| `^` | `caret` | `&` | `ampersand` |
| `<` | `lt` | `>` | `gt` |
| `'` | `apostrophe` | `"` | `quote` |
| `\` | `backslash` | `?` | `question` |
| `*` | `asterisk` | `=` | `equals` |

通过 `unsupportedChars` 添加的 `~`、反引号、竖线、`;` 分别使用 `tilde`、`backtick`、`pipe`、`semicolon`。其他自定义字符以 `unicode` 为前缀，将字符码的十六进制数位 `0–f` 对应为字母 `a–p`，确保名称仍只含英文字母且彼此不同。此表只决定替换名称，不会扩大默认不支持字符列表。

生成的别名格式为 `_<名称>_`。升级后请完整重建模板和 CSS；源码继续使用原始工具类，手写选择器或外部文件中引用的旧生成别名需要同步更新。小程序端和启用 `presetApplet` 的 H5 端使用相同编码；H5 端若只使用上游 preset，则不受影响。

## 源码改写规则

`transformerApplet` 只改写「能放类名的位置」里的工具类，具体按文件类型处理：

| 位置 | 行为 |
| --- | --- |
| 静态 `class` / `className` / `hover-class` / `hoverClass` 属性值 | 改写（`hover-class` 的值是运行时类名，需与 postprocess 的选择器别名一致；`placeholder`、`aria-label` 等其他静态属性的值是可见文案，永不改写） |
| `:class` 表达式里的字符串字面量、模板字符串静态部分 | 改写 |
| `@click` 等其他指令表达式、`{{ }}` 插值里的字符串（函数实参、展示文案） | 不改写（是运行时代码，改了会破坏行为） |
| `.js` / `.ts` / `.jsx` / `.tsx` 里的字符串字面量、模板字符串静态部分 | 改写 |
| 数组下标（`m[1]`、`p[key]`）、泛型、注释、正则字面量、插值表达式 | 不改写 |
| `<script>` / `<wxs>` 内容、`<style>` 内容、HTML 注释 | 不改写 |

边界的判定来自代码解析：`.vue` 用 Vue 模板编译器、`.js/.ts/.jsx/.tsx` 用 oxc 解析器先找出可改写的位置，再在其中做别名替换。解析失败的已知类型文件直接跳过改写（宁可漏一个工具类，也不能把脚本或表达式改坏）；只有不认识的文件类型回退为旧行为：整文件正则改写，只跳过 `/* */` 和 `<!-- -->` 注释。

已知取舍：纯 `.ts` 里无法区分「类名字符串」和普通字符串，所以字符串字面量里的工具类一律改写——动态类写法（`:class="'p-2.5 ' + cls"`、公共 `.ts` 里的类名映射表）依赖这个行为，代价是 `obj['p-2.5']` 这类数据 key 也会被改写。`:class` 表达式里的字符串同理：只认 `bind` 指令的 `class`/`className` 参数，其余指令表达式和插值一律不碰，把误伤范围压到最小。

括号外出现 `<` / `>` 的 token 不改写：纯文本模板里 extractor 会把标签残渣并进 token（如 `translate--1/2</text>`），改写它等于改坏源码。`[...]` 里的 `<` / `>` 不受影响，`[&>view]:text-red` 这类用子选择器写的任意变体照常别名（[#115](https://github.com/unocss-applet/unocss-applet/issues/115)）。

与 `transformerHover` / `transformerAttributify` 共用：这三个 transformer 都是 `enforce: 'pre'`，共用同一个源码缓冲。hover / attributify 改写过的文件，`transformerApplet` 会基于改写后的内容继续处理剩余工具类，最后统一回写——不会因编辑重叠报错，也不会漏改。

## 示例

以 `class` 为例：

### 转换前

```html
<div class="py-3.5 grid-cols-[0.7fr_repeat(7,1fr)]">
  py-3
</div>
```

### 转换后

```html
<div class="py-3_dot_5 grid-cols-_lbracket_0_dot_7fr_repeat_lparen_7_comma_1fr_rparen__rbracket_">
  py-3
</div>

<style>
.grid-cols-_lbracket_0_dot_7fr_repeat_lparen_7_comma_1fr_rparen__rbracket_ {
  grid-template-columns: 0.7fr repeat(7,1fr);
}

.py-3_dot_5 {
  padding-top:0.875rem;padding-bottom: 0.875rem;
}
</style>
```

## License

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/nei1ee)
