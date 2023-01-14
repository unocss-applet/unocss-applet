<p align="center">
<img src="https://github.com/unocss-applet/unocss-applet/raw/main/public/logo.svg" style="width:100px;" />
<h1 align="center">UnoCSS Applet</h1>
<p align="center">Using <a href="https://github.com/unocss/unocss">UnoCSS</a> in applet(for <a href="https://github.com/dcloudio/uni-app">UniApp</a> and <a href="https://github.com/NervJS/taro">Taro</a>) to be compatible with unsupported syntax.</p>
</p>
<p align="center">
<a href="https://www.npmjs.com/package/unocss-applet"><img src="https://img.shields.io/npm/v/unocss-applet?color=333333&amp;label=" alt="NPM version"></a></p>

## Presets and Plugins

- [unocss-applet](https://github.com/unocss-applet/unocss-applet/tree/main/packages/unocss-applet) - The default package with common presets and plugins
- [@unocss-applet/preset-applet](https://github.com/unocss-applet/unocss-applet/tree/main/packages/preset-applet) - The default preset (right now it's equivalent to `@unocss/preset-uno`)
- [@unocss-applet/preset-rem-to-rpx](https://github.com/unocss-applet/unocss-applet/tree/main/packages/preset-rem-to-rpx) - Coverts rem to rpx for utils.
- [@unocss-applet/transformer-applet](https://github.com/unocss-applet/unocss-applet/tree/main/packages/transformer-applet) - Compile classes that do not support applets into one class.
- [@unocss-applet/transformer-attributify](https://github.com/unocss-applet/unocss-applet/tree/main/packages/transformer-attributify) - Enables Attributify Mode for applet.

## Installation

```bash
npm i unocss-applet --save-dev # with npm
yarn add unocss-applet -D # with yarn
pnpm add unocss-applet -D # with pnpm
```

## Usage

### UnoCSS config

<details>
<summary>unocss.config.ts</summary><br>

```ts
import {
  defineConfig,
  presetAttributify,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

import {
  presetApplet,
  presetRemToRpx,
  transformerApplet,
  transformerAttributify,
} from 'unocss-applet'

export default defineConfig({
  presets: [
    presetApplet(),
    /**
     * you can add `presetAttributify()` here to enable unocss attributify mode prompt
     * although preset is not working for applet, but will generate useless css
     */
    presetAttributify(),
    presetRemToRpx(),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
    // Don't change the following order
    transformerAttributify(),
    transformerApplet(),
  ],
})
```

<br></details>

### For Platform

<details>
<summary>For UniApp with Vue3 and Vite</summary><br>

`vite.config.ts`

```ts
import UnoCSS from 'unocss/vite'

export default {
  plugins: [
    UnoCSS(),
  ],
}
```

`main.ts`

```ts
import 'uno.css'
```

<br></details>

<details>
<summary>For Taro(v3.5.6) with Vue3 and Webpack5</summary><br>

`config/index.js`

```js
import UnoCSS from 'unocss/webpack'
const config = {
  mini: {
    // ...
    webpackChain(chain, _webpack) {
      chain.plugin('unocss').use(UnoCSS())
    },
  },
  h5: {
    // ...
    webpackChain(chain, _webpack) {
      chain.plugin('unocss').use(UnoCSS())
    },
  },
}
```

`app.ts`

```ts
import 'uno.css'
```

<br></details>

## Example

- [starter-uni](https://github.com/zguolee/starter-uni)
- [ColorTimetable](https://github.com/zguolee/ColorTimetable)

## Acknowledgement

- [UnoCSS](https://github.com/unocss/unocss)

## License

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/zguolee)
