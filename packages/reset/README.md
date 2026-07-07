# @unocss-applet/reset

CSS reset 样式集合。

## 安装

```bash
npm i @unocss-applet/reset --save-dev # with npm
yarn add @unocss-applet/reset -D # with yarn
pnpm add @unocss-applet/reset -D # with pnpm
```

## 使用

可在入口文件引入下列任一 reset 样式。

uni-app 的入口是 `src/main.[j|t]s`。

Taro 的入口是 `src/app.[j|t]sx?`。

### button-after.css

针对 `button::after` 的 preflight，会移除所有 `button::after` 样式。

```ts
// uni-app
import '@unocss-applet/reset/uni-app/button-after.css'

// taro
import '@unocss-applet/reset/taro/button-after.css'
```

#### 何时使用

若想更灵活地自定义按钮边框，请在其他 reset 文件之前引入本文件。

#### 何时不要使用

它可能与 UI 框架产生冲突。若发现按钮样式异常，请移除该引入。

### normalize.css

**不推荐**使用，因为使用了 `:where`，多数平台可能不支持。

来源：<https://github.com/csstools/normalize.css>、<https://cdn.jsdelivr.net/npm/@unocss/reset@66.7.4/normalize.css>。

```ts
// uni-app
import '@unocss-applet/reset/uni-app/normalize.css'

// taro
import '@unocss-applet/reset/taro/normalize.css'
```

### sanitize.css

**不推荐**使用，因为使用了 `:where`，多数平台可能不支持。

来源：<https://github.com/csstools/sanitize.css>、<https://cdn.jsdelivr.net/npm/@unocss/reset@66.7.4/sanitize>。

```ts
// uni-app
import '@unocss-applet/reset/uni-app/sanitize/sanitize.css'
import '@unocss-applet/reset/uni-app/sanitize/assets.css'

// taro
import '@unocss-applet/reset/taro/sanitize/sanitize.css'
import '@unocss-applet/reset/taro/sanitize/assets.css'
```

### Eric Meyer

来源：<https://meyerweb.com/eric/tools/css/reset/index.html>、<https://cdn.jsdelivr.net/npm/@unocss/reset@66.7.4/eric-meyer.css>。

```ts
// uni-app
import '@unocss-applet/reset/uni-app/eric-meyer.css'

// taro
import '@unocss-applet/reset/taro/eric-meyer.css'
```

### tailwind.css

基于 [Tailwind v3 preflight](https://v3.tailwindcss.com/docs/preflight)，采用[静态形式](https://github.com/tailwindlabs/tailwindcss/blob/v3.4.18/src/css/preflight.css)。

```ts
// uni-app
import '@unocss-applet/reset/uni-app/tailwind.css'

// taro
import '@unocss-applet/reset/taro/tailwind.css'
```

#### 改动点

##### 静态化

这是 Tailwind v3 preflight 的静态版本，不会从主题继承任何样式。

##### 边框颜色

Tailwind v3 preflight 中，边框默认颜色读取自主题的 `borderColor.DEFAULT`。要在本 reset 中自定义，改用 CSS 变量：

```css
/* uni-app */
@import '@unocss-applet/reset/uni-app/tailwind.css'
/* taro */
@import '@unocss-applet/reset/taro/tailwind.css'

:root {
  --un-default-border-color: #e5e7eb;
}
```

##### 跨端兼容

我们在样式文件中加入了条件编译，以提供跨端兼容性。

### tailwind-compat.css

基于 [tailwind.css](#tailwindcss)，清理了部分样式以避免与 UI 框架冲突。

```ts
// uni-app
import '@unocss-applet/reset/uni-app/tailwind-compat.css'

// taro
import '@unocss-applet/reset/taro/tailwind-compat.css'
```

#### 改动点

##### [继承自 `tailwind.css` 的改动](#tailwindcss)

##### 移除按钮的背景色覆盖

关联 issue：[#2127](https://github.com/unocss/unocss/issues/2127)

<table>
<thead>
<tr style="text-align: center">
<th>前</th>
<th>后</th>
</tr>
</thead>
<tbody>
<tr>
<td>

```css
button,
[type='button'],
[type='reset'],
[type='submit'] {
  -webkit-appearance: button; /* 1 */
  background-color: transparent; /* 2 */
  background-image: none; /* 2 */
}
```

</td>

<td>

```css
button,
[type='button'],
[type='reset'],
[type='submit'] {
  -webkit-appearance: button; /* 1 */
  /*background-color: transparent; !* 2 *!*/
  background-image: none; /* 2 */
}
```

</td>
</tr>
</tbody>
</table>

### tailwind-v4.css

```ts
// uni-app
import '@unocss-applet/reset/uni-app/tailwind-v4.css'

// taro
import '@unocss-applet/reset/taro/tailwind-v4.css'
```

基于 [Tailwind v4 preflight](https://tailwindcss.com/docs/preflight)，采用[静态形式](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/preflight.css)。

## 改动点

### 静态化

这是 Tailwind v4 preflight 的静态版本，不会从主题继承任何样式。

### 跨端兼容

我们在样式文件中加入了条件编译，以提供跨端兼容性。

## License

MIT License © 2022-PRESENT ModyQyW
