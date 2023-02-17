# @unocss-applet/preset-rpx-to-rem

Coverts rem to rpx for utils.

## Instal

```bash
npm i @unocss-applet/preset-rpx-to-rem --save-dev # with npm
yarn add @unocss-applet/preset-rpx-to-rem -D # with yarn
pnpm add @unocss-applet/preset-rpx-to-rem -D # with pnpm
```
  
## Usage

```ts
import { defineConfig } from 'unocss'

import presetRpxToRem from '@unocss-applet/preset-rpx-to-rem'

export default defineConfig({
  presets: [
    // ...
    presetRpxToRem({ baseFontSize: 16, screenWidth: 375 }),
  ],
})
```

## Type Declarations

```ts
export interface RpxToRemOptions {
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
<div class="p-32rpx"></div>
```

<table><tr><td width="500px" valign="top">

### without

```css
.p-32rpx {
  padding: 32rpx;
}
```

</td><td width="500px" valign="top">

### with

```css
.p-32rpx {
  padding: 1rem;
}
```

</td></tr></table>

## License

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/zguolee)
