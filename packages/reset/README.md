# @unocss-applet/reset

Collection of reset CSS stylesheets.

## Install

```bash
npm i @unocss-applet/reset --save-dev # with npm
yarn add @unocss-applet/reset -D # with yarn
pnpm add @unocss-applet/reset -D # with pnpm
```

## Usage

You can add one of the following reset stylesheets to your entry file.

For uni-app, it should be `src/main.[j|t]s`.

For taro, it should be `src/app.[j|t]sx?`.

### button-after.css

Preflight for `button::after`. Will remove all `button::after` styles.

```ts
// uni-app
import '@unocss-applet/reset/uni-app/button-after.css'

// taro
import '@unocss-applet/reset/taro/button-after.css'
```

#### When to use it

Import this file before other reset files if you want to customize button border more flexibly.

#### When not to use it

It may bring conflicts with UI frameworks. Remove the import if you find button styles wrong.

### normalize.css

**NOT RECOMMEND** since `:where` is used which is not likely supported in many platforms.

Source: <https://github.com/csstools/normalize.css>

```ts
// uni-app
import '@unocss-applet/reset/uni-app/normalize.css'

// taro
import '@unocss-applet/reset/taro/normalize.css'
```

### modern-normalize

Source: <https://github.com/sindresorhus/modern-normalize>

```ts
// uni-app
import '@unocss-applet/reset/uni-app/modern-normalize.css'

// taro
import '@unocss-applet/reset/taro/modern-normalize.css'
```

### sanitize.css

**NOT RECOMMEND** since `:where` is used which is not likely supported in many platforms.

Source: <https://github.com/csstools/sanitize.css>

```ts
// uni-app
import '@unocss-applet/reset/uni-app/sanitize/sanitize.css'
import '@unocss-applet/reset/uni-app/sanitize/assets.css'

// taro
import '@unocss-applet/reset/taro/sanitize/sanitize.css'
import '@unocss-applet/reset/taro/sanitize/assets.css'
```

### Eric Meyer

Source: <https://meyerweb.com/eric/tools/css/reset/index.html>

```ts
// uni-app
import '@unocss-applet/reset/uni-app/eric-meyer.css'

// taro
import '@unocss-applet/reset/taro/eric-meyer.css'
```

### tailwind.css

Based on [Tailwind's preflight](https://tailwindcss.com/docs/preflight), in static forms.

```ts
// uni-app
import '@unocss-applet/reset/uni-app/tailwind.css'

// taro
import '@unocss-applet/reset/taro/tailwind.css'
```

#### Changes

##### Static

This is provided as a static version of Tailwind's preflight, so it doesn't inherit any styles from the theme.

##### Border color

In Tailwind's preflight, the border color default border color is read from the theme borderColor.DEFAULT. To customize it in Uno's reset, we use CSS variable instead:

```css
/* uni-app */
@import '@unocss-applet/reset/uni-app/tailwind.css'
/* taro */
@import '@unocss-applet/reset/taro/tailwind.css'

:root {
  --un-default-border-color: #e5e7eb;
}
```

##### Cross-platform compatibility

We add conditional compilation in style files to bring cross-platform compatibility.

### tailwind-compat.css

Based on [tailwind.css](./tailwind.css), with some styles clean up to avoid conflicts with UI frameworks.

```ts
// uni-app
import '@unocss-applet/reset/uni-app/tailwind-compat.css'

// taro
import '@unocss-applet/reset/taro/tailwind-compat.css'
```

#### Changes

##### [Changes inherit from `tailwind.css`](#tailwindcss)

##### Remove background color override for buttons

Linked issue: [#2127](https://github.com/unocss/unocss/issues/2127)

<table>
<thead>
<tr style="text-align: center">
<th>Before</th>
<th>After</th>
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

## License

MIT License &copy; 2022-PRESENT ModyQyW
