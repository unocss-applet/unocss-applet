# @unocss-applet/preset-rem-rpx

工具类 rem <=> rpx 互转预设。

## 安装

```bash
npm i @unocss-applet/preset-rem-rpx --save-dev # with npm
yarn add @unocss-applet/preset-rem-rpx -D # with yarn
pnpm add @unocss-applet/preset-rem-rpx -D # with pnpm
```

## 使用

```ts
import { presetRemRpx } from '@unocss-applet/preset-rem-rpx'

import { defineConfig } from 'unocss'

export default defineConfig({
  presets: [
    // ...
    presetRemRpx({ baseFontSize: 16, screenWidth: 375, mode: 'rem2rpx' }),
  ],
})
```

⚠️ 若把 `baseFontSize` 改为非 `16` 的值并使用 `rpx2rem` 模式，需要在 H5 端设置对应的根 `font-size`。

## 类型声明

```ts
export interface RemRpxOptions {
  /**
   * 1rem = n px
   * @default 16
   */
  baseFontSize?: number

  /**
   * 屏幕宽度（px）
   * @default 375
   */
  screenWidth?: number

  /**
   * rem 转 rpx，或 rpx 转 rem
   * @default 'rem2rpx'
   */
  mode?: 'rem2rpx' | 'rpx2rem'
}
```

```html
<div class="m-1rem p-32rpx"></div>
```

<table><tr><td width="300px" valign="top">

### 未启用

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

MIT License © 2022-PRESENT [Neil Lee](https://github.com/zguolee)
