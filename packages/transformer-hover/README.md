# @unocss-applet/transformer-hover

把 `hover:` 工具类改写到小程序原生的 `hover-class` 属性，用于 [UnoCSS](https://github.com/unocss/unocss)。

小程序不支持 `:hover` 伪类，UnoCSS 生成的 `hover:xxx` 工具类在运行期会被静默丢弃。原生 `view` / `button` 组件通过字符串属性 `hover-class` 表达按下态。本 transformer 把 `hover:` 工具类从静态 `class` / `className` 属性移到 `hover-class`（自动去掉 `hover:` 前缀，因为属性本身已隐含按下态语义），让工具类在小程序端真正生效。

## 安装

```bash
npm i @unocss-applet/transformer-hover --save-dev # with npm
yarn add @unocss-applet/transformer-hover -D # with yarn
pnpm add @unocss-applet/transformer-hover -D # with pnpm
```

## 使用

**仅在小程序端启用**——H5 端 `:hover` 伪类原生可用，启用反而会破坏它。沿用你为 `transformerAttributify` 已经写好的 `isApplet` 分支即可。

```ts
// uni-app (vite.config.ts)
import process from 'node:process'
import { transformerHover } from '@unocss-applet/transformer-hover'

const isApplet = process.env.UNI_PLATFORM?.startsWith('mp-') ?? false

export default {
  // ...
  UnoCSS: {
    transformers: [
      ...(isApplet ? [transformerHover()] : []),
    ],
  },
}
```

```ts
// Taro (uno.config.ts)
import process from 'node:process'
import { transformerHover } from 'unocss-applet'

const isApplet = process.env.TARO_ENV !== 'h5'

export default defineConfig({
  transformers: [
    ...(isApplet ? [transformerHover()] : []),
  ],
})
```

## 示例

```html
<!-- 独立的 hover: 工具类移入 hover-class -->
<div class="hover:bg-red hover:text-xl"/>
⬇
<div hover-class="bg-red text-xl"/>

<!-- 既有静态 hover-class 会与移入的工具类合并 -->
<div class="hover:bg-red" hover-class="text-xl"/>
⬇
<div hover-class="text-xl bg-red"/>

<!-- 既有动态 :hover-class 会被包进模板字符串，在运行期追加移入的工具类 -->
<div class="hover:bg-red" :hover-class="bool ? 'text-xl' : 'text-sm'"/>
⬇
<div :hover-class="`${bool ? 'text-xl' : 'text-sm'} bg-red`"/>
```

## 支持的文件类型

- `.vue`（uni-app / Taro-vue）——读取静态 `class` 属性；写入/合并到 `hover-class`（静态）或包裹 `:hover-class`（动态）。
- `.jsx` / `.tsx`（Taro React）——读取静态 `className` 属性；写入/合并到 `hoverClass`（静态）或包裹 `hoverClass={expr}`（动态）。

## 移动条件

仅当 `hover:` 去掉可选前导 `!` important 修饰符和 `hover:` 前缀后，剩余 body 是一个**无进一步变体限定符**的真实 UnoCSS 工具类时才移动（即 body 的顶层 `:` 必须位于 `[...]` 任意值组之内）。前导 `!` 会随 body 一起保留。

| 输入 | 是否移动 | 结果 |
| --- | :---: | --- |
| `hover:bg-red`、`!hover:bg-red` | ✅ | `hover-class="bg-red"` / `hover-class="!bg-red"` |
| `hover:bg-[url(http://x)]`、`hover:bg-red/50` | ✅ | 任意值与透明度修饰符照常移动 |
| `hover:dark:bg-red`、`hover:focus:bg-red`、`hover:peer-focus:bg-red` | ❌ | `hover-class` 无法表达 dark/focus/peer 限定 |
| `dark:hover:bg-red`、`md:hover:p-2` | ❌ | 限定符在 `hover:` 之前 |
| `hover:notarealthing` | ❌ | 不是已识别的工具类 |

## 不在支持范围内

- **带变体限定符的 `hover:`**（任意一侧——`dark:hover:`、`hover:focus:`、`hover:peer-focus:`）：`hover-class` 无法表达变体限定符，保留在 `class` 中。
- **非工具类的 `hover:`**（body 不被 UnoCSS 识别）：保留在 `class` 中。
- **动态 `:class="[cond ? 'hover:a' : 'hover:b']"` / `className={[...]}` 表达式内的 `hover:` 字符串字面量**：正则无法可靠解析 JS 表达式来提取字面量，需手动写 `hover-class`。

## 类型声明

```ts
export interface TransformerHoverOptions {
  /**
   * 写入模板的 hover 属性名
   *
   * @default 'hover-class' (Vue) / 'hoverClass' (JSX)
   */
  hoverAttributeName?: string

  /**
   * 扫描 `hover:` 工具类的 class 属性名
   *
   * @default 'class' (Vue) / 'className' (JSX)
   */
  classAttributeName?: string
}
```

## License

MIT License © 2023-present [UnoCSS Applet](https://github.com/unocss-applet/unocss-applet)
