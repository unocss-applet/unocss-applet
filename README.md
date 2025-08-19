<p align="center">
<img src="https://github.com/unocss-applet/unocss-applet/raw/main/public/logo.svg" style="width:100px;" />
<h1 align="center">UnoCSS Applet</h1>
<p align="center">Using <a href="https://github.com/unocss/unocss">UnoCSS</a> in applet(for <a href="https://github.com/dcloudio/uni-app">UniApp</a> and <a href="https://github.com/NervJS/taro">Taro</a>) to be compatible with unsupported syntax.</p>
</p>
<p align="center">
<a href="https://www.npmjs.com/package/unocss-applet"><img src="https://img.shields.io/npm/v/unocss-applet?style=flat&colorA=858585&colorB=F17F42" alt="NPM version"></a>
<a href="https://www.npmjs.com/package/unocss-applet"><img src="https://img.shields.io/npm/dm/unocss-applet?style=flat&colorA=858585&colorB=F17F42" alt="NPM Downloads"></a>
<a href="https://bundlephobia.com/result?p=unocss-applet"><img src="https://img.shields.io/bundlephobia/minzip/unocss-applet?style=flat&colorA=858585&colorB=F17F42" alt="Bundle"></a>
<a href="https://github.com/unocss-applet/unocss-applet/blob/main/LICENSE"><img src="https://img.shields.io/github/license/unocss-applet/unocss-applet.svg?style=flat&colorA=858585&colorB=F17F42" alt="License"></a>
</p>

<p align='center'>
<b>English</b> | <a href="https://github.com/unocss-applet/unocss-applet/blob/main/README.zh-CN.md">简体中文</a>
</p>

## Presets and Plugins

- [unocss-applet](https://github.com/unocss-applet/unocss-applet/tree/main/packages/unocss-applet) - The default package with common presets and plugins.
- [@unocss-applet/preset-applet](https://github.com/unocss-applet/unocss-applet/tree/main/packages/preset-applet) - The default preset (right now it's equivalent to `@unocss/preset-wind3`).
- [@unocss-applet/preset-rem-rpx](https://github.com/unocss-applet/unocss-applet/tree/main/packages/preset-rem-rpx) - Coverts rem <=> rpx for utils.
- [@unocss-applet/transformer-attributify](https://github.com/unocss-applet/unocss-applet/tree/main/packages/transformer-attributify) - Enables Attributify Mode for applet.
- [@unocss-applet/reset](https://github.com/unocss-applet/unocss-applet/tree/main/packages/reset) - Collection of reset CSS stylesheets.

## Installation

```bash
npm i unocss-applet --save-dev # with npm
yarn add unocss-applet -D # with yarn
pnpm add unocss-applet -D # with pnpm
```

## Usage

### UnoCSS config

<details>
<summary>uno.config.ts</summary><br>

```ts
import type { Preset, SourceCodeTransformer } from 'unocss'
import { defineConfig, presetAttributify } from 'unocss'

import {
  presetApplet,
  presetRemRpx,
  transformerAttributify,
} from 'unocss-applet'

// uni-app
const isApplet = process.env?.UNI_PLATFORM?.startsWith('mp-') ?? false
// taro
// const isApplet = process.env.TARO_ENV !== 'h5' ?? false
const presets: Preset[] = []
const transformers: SourceCodeTransformer[] = []

if (isApplet) {
  presets.push(presetApplet())
  presets.push(presetRemRpx())
  transformers.push(transformerAttributify({ ignoreAttributes: ['block'] }))
}
else {
  presets.push(presetApplet())
  presets.push(presetAttributify())
  presets.push(presetRemRpx({ mode: 'rpx2rem' }))
}

export default defineConfig({
  presets: [
    // ...
    ...presets,
  ],
  transformers: [
    // ...
    ...transformers,
  ],
})
```

<br></details>

### For Platform

<details>
<summary>UniApp + Vue3 + Vite</summary><br>

`vite.config.ts` (UnoCSS v0.58 or below) / `vite.config.mts` (UnoCSS v0.59 or above)

```ts
import uniModule from '@dcloudio/vite-plugin-uni'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'

// @ts-expect-error missing types
const Uni = uniModule.default || uniModule

export default defineConfig({
  plugins: [
    Uni(),
    UnoCSS(),
  ],
})
```

`main.ts`

```ts
import 'uno.css'
```

<br></details>

<details>
<summary>Taro v3.6 + Vue3 + Webpack5</summary><br>

`config/index.js` (UnoCSS v0.59 or above)

```js
import { createSwcRegister, getModuleDefaultExport } from '@tarojs/helper'

export default async () => {
  createSwcRegister({
    only: [filePath => filePath.includes('@unocss')],
  })
  const UnoCSS = getModuleDefaultExport(await import('@unocss/webpack'))
  return {
    mini: {
      // ...
      webpackChain(chain, _webpack) {
        chain.plugin('unocss').use(UnoCSS())
      }
    },
    h5: {
      // ...
      webpackChain(chain) {
        chain.plugin('unocss').use(UnoCSS())
      }
    }
  }
}
```

`config/index.js` (UnoCSS v0.58 or below)

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

- [starter-uni](https://github.com/nei1ee/starter-uni)
- [ColorTimetable](https://github.com/nei1ee/ColorTimetable)

## Acknowledgement

- [UnoCSS](https://github.com/unocss/unocss)

## License

MIT License &copy; 2022-PRESENT [Neil](https://github.com/nei1ee) and all contributors.
