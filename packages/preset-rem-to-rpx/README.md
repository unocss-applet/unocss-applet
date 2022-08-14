# @unocss-applet/preset-rem-to-rpx

Coverts rem to rpx for utils.

## Installation

```bash
npm i unocss-preset-rem-to-rpx unocss --save-dev # with npm
yarn add unocss-preset-rem-to-rpx unocss -D # with yarn
pnpm add unocss-preset-rem-to-rpx unocss -D # with pnpm
```

```ts
import presetUno from '@unocss/preset-uno'
import presetRemToRpx from 'unocss-preset-rem-to-rpx'

UnoCSS({
  presets: [
    presetUno(),
    presetRemToRpx()
  ],
})
```

## Usage

```html
<div class="m-2"></div>
```

<table><tr><td width="500px" valign="top">

### without

```css
.m-2 {
  margin: 0.5rem;
}
```

</td><td width="500px" valign="top">

### with

```css
.m-2 {
  margin: 16rpx;
}
```

</td></tr></table>

## License

[MIT](./LICENSE) License © 2022 [Neil Lee](https://github.com/zguolee)
