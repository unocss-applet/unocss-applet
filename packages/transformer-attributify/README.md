# @unocss-applet/transformer-attributify

为小程序启用 [UnoCSS](https://github.com/unocss/unocss) 的 Attributify 模式。

## 安装

```bash
npm i @unocss-applet/transformer-attributify --save-dev # with npm
yarn add @unocss-applet/transformer-attributify -D # with yarn
pnpm add @unocss-applet/transformer-attributify -D # with pnpm
```

## 使用

```ts
import transformerAttributify from '@unocss-applet/transformer-attributify'

import { defineConfig } from 'unocss'

export default defineConfig({
  // ...
  transformers: [
    transformerAttributify(),
  ],
})
```

## 类型声明

```ts
export interface TransformerAttributifyOptions {
  /**
   * @default 'un-'
   */
  prefix?: string

  /**
   * 仅匹配带前缀的属性
   *
   * @default false
   */
  prefixedOnly?: boolean

  /**
   * 是否匹配无值属性
   *
   * 例如
   * ```html
   * <div mt-2 />
   * ```
   *
   * @default true
   */
  nonValuedAttribute?: boolean

  /**
   * 需要忽略、不提取的属性列表
   */
  ignoreAttributes?: string[]

  /**
   * 是否删除已合并进 `class=""` 的属性
   * @default true
   */
  deleteAttributes?: boolean
}
```

## 示例

> 除非把 `deleteAttributes` 设为 `false`，否则属性会被删除。

### 转换前

```html
<div h-80 text-center flex flex-col align-center select-none all:transition-400>
  py-3
</div>
```

### 转换后

```html
<div class="h-80 text-center flex flex-col select-none all:transition-400">
  py-3
</div>
```

## JSX / TSX 支持

除 `.vue` 外，本 transformer 也会处理 `.jsx` / `.tsx`。在 JSX 侧：

- 为兼容 React，生成的工具类以 `className`（而非 `class`）注入。
- 静态 `className="foo"` 会把工具类追加到其值后；动态 `className={expr}` 会被改写成保留运行期表达式的模板字符串，例如 `className={c} mt-2` → `` className={`${c} mt-2`} ``。
- 动态非 class 属性（如 `text={cond ? 'a' : 'b'}`）和展开属性（`{...props}`）会被跳过——它们无法在编译期静态处理。
- 含 `.`（如 `mt-2.5`）或 `:`（如 `dark:text-red`）的 token 不是合法的 JSX 裸属性名——JSX 标识符不能包含 `.` 或 `:`，请改用 `className`。

JSX 侧不在支持范围内（元素匹配器基于正则，并非完整的 JSX 解析器）：

- Fragment 简写（`<>...</>`）不会被匹配。
- 看起来像标签的字符串或注释子节点（如字符串子节点 `'<div>'`，或含 `<foo>` 的 JSX 注释）可能被误读为真实标签。请避免在本 transformer 处理的手写模板里出现这类内容。
- 任意属性表达式中的 `>` 会被当作标签的闭合 `>`，因此属性表达式含 `>` 的元素——箭头函数（`onClick={() => fn()}`）、比较运算符（`disabled={a > b}`）、字符串字面量里的 `<`/`>`——只会匹配到该 `>` 处并被静默跳过：该元素上的工具类会被丢弃且不报错。这是真实 Taro/React 代码里最常见的坑。要避免丢失，请把这类元素上的工具类写进字面量 `className="..."`。

## License

MIT License © 2022-PRESENT [Neil Lee](https://github.com/zguolee)
