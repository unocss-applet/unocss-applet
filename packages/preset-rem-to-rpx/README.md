# @unocss-applet/preset-rem-to-rpx

Coverts rem to rpx for utils.

## Instal

```bash
npm i @unocss-applet/preset-rem-to-rpx --save-dev # with npm
yarn add @unocss-applet/preset-rem-to-rpx -D # with yarn
pnpm add @unocss-applet/preset-rem-to-rpx -D # with pnpm
```
  
## Usage

```ts
import { defineConfig } from 'unocss'

import presetRemToRpx from '@unocss-applet/preset-rem-to-rpx'

export default defineConfig({
  presets: [
    // ...
    presetRemToRpx({ baseFontSize: 16, screenWidth: 375 }),
  ],
})
```

## Type Declarations

```ts
export interface RemToRpxOptions {
  /**
   * Enable applet, only build applet should be true
   * e.g. In uniapp set `enable: !(process.env.UNI_PLATFORM === 'h5')` to disable for h5
   * @default true
   */
  enable?: boolean

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
}
```

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
