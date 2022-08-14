# @unocss-applet/preset-rem-to-rpx

Coverts rem to rpx for utils.

## Instal

```bash
npm i @unocss-applet/preset-rem-to-rpx --save-dev # with npm
yarn add @unocss-applet/preset-rem-to-rpx -D # with yarn
pnpm add @unocss-applet/preset-rem-to-rpx -D # with pnpm
```

```ts
import presetUno from '@unocss/preset-uno'
import presetRemToRpx from '@unocss-applet/preset-rem-to-rpx'

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

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/zguolee)
