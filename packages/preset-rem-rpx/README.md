# @unocss-applet/preset-rem-rpx

Coverts rem <=> rpx for utils.

## Instal

```bash
npm i @unocss-applet/preset-rem-rpx --save-dev # with npm
yarn add @unocss-applet/preset-rem-rpx -D # with yarn
pnpm add @unocss-applet/preset-rem-rpx -D # with pnpm
```

## Usage

```ts
import { defineConfig } from 'unocss'

import { presetRemRpx } from '@unocss-applet/preset-rem-rpx'

export default defineConfig({
  presets: [
    // ...
    presetRemRpx({ baseFontSize: 16, screenWidth: 375, mode: 'rem2rpx' }),
  ],
})
```

⚠️If you change `baseFontSize` other than `16` and use `rpx2rem` mode, you need to set the corresponding root `font-size` in H5.

## Type Declarations

```ts
export interface RemRpxOptions {
  /**
   * 1rem = n px
   * @default 16
   */
  baseFontSize?: number

  /**
   * screen width in px
   * @default 375
   */
  screenWidth?: number

  /**
   * rem to rpx or rpx to rem
   * @default 'rem2rpx'
   */
  mode?: 'rem2rpx' | 'rpx2rem'
}
```

```html
<div class="m-1rem p-32rpx"></div>
```

<table><tr><td width="300px" valign="top">

### without

```css
.m-1rem {
  margin: 1rem;
}
.p-32rpx {
  padding: 32rpx;
}
```

</td><td width="300px" valign="top">

### rem2rpx

```css
.m-1rem {
  margin: 32rpx;
}
.p-32rpx {
  padding: 32rpx;
}
```

</td><td width="300px" valign="top">

### rpx2rem

```css
.m-1rem {
  margin: 1rem;
}
.p-32rpx {
  padding: 1rem;
}
```

</td></tr></table>

## License

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/zguolee)
