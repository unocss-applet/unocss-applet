# @unocss-applet/preset-rem-to-rpx

Coverts rem <=> rpx for utils.

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
   * Enable rem to rpx, disable rpx to rem
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
<div class="m-1rem p-32rpx"></div>
```

<table><tr><td width="500px" valign="top">

### enabled

```css
.m-1rem {
  margin: 32rpx;
}
.p-32rpx {
  padding: 32rpx;
}
```

</td><td width="500px" valign="top">

### disabled

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
