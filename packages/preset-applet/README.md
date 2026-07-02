# @unocss-applet/preset-applet

[UnoCSS](https://github.com/unocss/unocss) 的小程序预设，包裹 [`@unocss/preset-wind3`](https://github.com/unocss/unocss/tree/main/packages-presets/preset-wind3)（默认）/ [`@unocss/preset-wind4`](https://github.com/unocss/unocss/tree/main/packages-presets/preset-wind4)，对部分 CSS 选择器做转换以兼容小程序。

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
   * @default ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$', '{', '}', '@', '+', '^', '&', '<', '>', '\'', '\\', '"', '?', '*']
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
- 类名中的不支持字符（`. : [ / % ! # ( ) ...`）会被替换为 `_a_`，使生成的选择器在 applet wxss 中可引用。

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
<div class="py-3_a_5 grid-cols-_a_0_a_7fr_repeat_a_7_a_1fr_a__a_">
  py-3
</div>

<style>
.grid-cols-_a_0_a_7fr_repeat_a_7_a_1fr_a__a_ {
  grid-template-columns: 0.7fr repeat(7,1fr);
}

.py-3_a_5 {
  padding-top:0.875rem;padding-bottom: 0.875rem;
}
</style>
```

## License

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/zguolee)
