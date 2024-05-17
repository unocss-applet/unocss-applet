<p align="center">
<img src="https://github.com/unocss-applet/unocss-applet/raw/main/public/logo.svg" style="width:100px;" />
<h1 align="center">UnoCSS Applet</h1>
<p align="center">在小程序(<a href="https://github.com/dcloudio/uni-app">UniApp</a> 和 <a href="https://github.com/NervJS/taro">Taro</a>)中使用<a href="https://github.com/unocss/unocss">UnoCSS</a>，兼容不支持的语法。</p>
</p>
<p align="center">
<a href="https://www.npmjs.com/package/unocss-applet"><img src="https://img.shields.io/npm/v/unocss-applet?color=333333&amp;label=" alt="NPM version"></a>
</p>

<p align='center'>
<a href="https://github.com/unocss-applet/unocss-applet/blob/main/README.md">English</a> | <b>简体中文</b>
</p>

## 预设和插件

- [unocss-applet](https://github.com/unocss-applet/unocss-applet/tree/main/packages/unocss-applet) - 主包，包含所有预设和插件。
- [@unocss-applet/preset-applet](https://github.com/unocss-applet/unocss-applet/tree/main/packages/preset-applet) - 默认预设（等同于`@unocss/preset-uno`）。
- [@unocss-applet/preset-rem-rpx](https://github.com/unocss-applet/unocss-applet/tree/main/packages/preset-rem-rpx) - 转换rem <=> rpx的工具。
- [@unocss-applet/transformer-attributify](https://github.com/unocss-applet/unocss-applet/tree/main/packages/transformer-attributify) - 为小程序启用 Attributify 模式。
- [@unocss-applet/reset](https://github.com/unocss-applet/unocss-applet/tree/main/packages/reset) - CSS 样式重置集合。

## 安装

```bash
npm i unocss-applet --save-dev # with npm
yarn add unocss-applet -D # with yarn
pnpm add unocss-applet -D # with pnpm
```

## 使用

### UnoCSS 配置

<details>
<summary>uno.config.ts</summary><br>

```ts
import type { Preset, SourceCodeTransformer } from 'unocss'
import { defineConfig } from 'unocss'

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

### 平台配置

<details>
<summary>UniApp + Vue3 + Vite</summary><br>

`vite.config.ts`（UnoCSS v0.58 和更低版本）/ `vite.config.mts`（UnoCSS v0.59 和更高版本）

```ts
import { defineConfig } from 'vite'
import uniModule from '@dcloudio/vite-plugin-uni'
import UnoCSS from 'unocss/vite'

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

`config/index.js`（UnoCSS v0.59 和更高版本）

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

`config/index.js`（UnoCSS v0.58 和更低版本）

```js
import UnoCSS from '@unocss/webpack'

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

## 示例

- [starter-uni](https://github.com/zguolee/starter-uni)
- [ColorTimetable](https://github.com/zguolee/ColorTimetable)

## 感谢

- [UnoCSS](https://github.com/unocss/unocss)

## License

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/zguolee) 和所有贡献者。
