<p align="center">
<img src="https://github.com/unocss-applet/unocss-applet/raw/main/public/logo.svg" alt="UnoCSS Applet logo" style="width:100px;" />
<h1 align="center">UnoCSS Applet</h1>
<p align="center">在小程序(<a href="https://github.com/dcloudio/uni-app">UniApp</a> 和 <a href="https://github.com/NervJS/taro">Taro</a>)中使用<a href="https://github.com/unocss/unocss">UnoCSS</a>，兼容不支持的语法。</p>
</p>
<p align="center">
<a href="https://www.npmjs.com/package/unocss-applet"><img src="https://img.shields.io/npm/v/unocss-applet?style=flat&colorA=858585&colorB=F17F42" alt="NPM version"></a>
<a href="https://www.npmjs.com/package/unocss-applet"><img src="https://img.shields.io/npm/dm/unocss-applet?style=flat&colorA=858585&colorB=F17F42" alt="NPM Downloads"></a>
<a href="https://bundlephobia.com/result?p=unocss-applet"><img src="https://img.shields.io/bundlephobia/minzip/unocss-applet?style=flat&colorA=858585&colorB=F17F42" alt="Bundle"></a>
<a href="https://github.com/unocss-applet/unocss-applet/blob/main/LICENSE"><img src="https://img.shields.io/github/license/unocss-applet/unocss-applet.svg?style=flat&colorA=858585&colorB=F17F42" alt="License"></a>
<a href="https://deepwiki.com/unocss-applet/unocss-applet"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
</p>

## 预设和插件

- [unocss-applet](https://github.com/unocss-applet/unocss-applet/tree/main/packages/unocss-applet) - 主包，包含所有预设和插件。
- [@unocss-applet/preset-applet](https://github.com/unocss-applet/unocss-applet/tree/main/packages/preset-applet) - 默认预设，包裹 `@unocss/preset-wind3`（默认）/ `@unocss/preset-wind4`。
- [@unocss-applet/preset-rem-rpx](https://github.com/unocss-applet/unocss-applet/tree/main/packages/preset-rem-rpx) - 转换rem <=> rpx的工具。
- [@unocss-applet/transformer-attributify](https://github.com/unocss-applet/unocss-applet/tree/main/packages/transformer-attributify) - 为小程序启用 Attributify 模式。
- [@unocss-applet/reset](https://github.com/unocss-applet/unocss-applet/tree/main/packages/reset) - CSS 样式重置集合。

> 各 preset / transformer 与上游 UnoCSS 的兼容关系、不支持项及变通方案见 [COMPATIBILITY.md](./COMPATIBILITY.md)。

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
  presets.push(presetRemRpx({ mode: 'rpx2rem' }))
  presets.push(presetAttributify())
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
// use @uni-helper/plugin-uni support ESM
import Uni from '@uni-helper/plugin-uni'
import UnoCSS from '@unocss/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Uni(),
    UnoCSS() as any,
  ],
})
```

`main.ts`

```ts
import 'uno.css'
```

<br></details>

<details>
<summary>Taro v3.6 / v4 + React + Webpack5</summary><br>

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
    webpackChain(chain) {
      chain.plugin('unocss').use(UnoCSS())
    },
  },
}
```

`app.ts`

```ts
import 'uno.css'
```

> ⚠️ 小程序端（weapp 等）已验证可正常编译并生成工具类；**H5 端目前会构建失败**：`@unocss/webpack` 的虚拟模块 `uno.css` 是占位符，本应由插件 `processAssets` 阶段替换，但 Taro H5 的 `style-loader` / `mini-css-extract-plugin` → `css-loader` → `postcss-loader` 链会在替换前先把它当 CSS 解析，导致 `ModuleParseError`。这是 `@unocss/webpack` 与 Taro Webpack5 H5 端的集成问题，与 `unocss-applet` 预设本身无关。H5 端如需使用，可改用 `@unocss/cli` 预生成 `uno.css` 再 import 的方案。完整可运行示例见仓库内 [`examples/taro3`](./examples/taro3)、[`examples/taro4`](./examples/taro4)。

<br></details>

## 示例

仓库内集成示例（均启用了上游 `presetIcons`）：

- [`examples/uni-app`](../../examples/uni-app) - uni-app + Vue3 + Vite
- [`examples/taro3`](../../examples/taro3) - Taro 3.6 + React + Webpack5
- [`examples/taro4`](../../examples/taro4) - Taro 4.2 + React + Webpack5

社区示例：

- [vitesse-uni-app](https://github.com/uni-helper/vitesse-uni-app)
- [wot-starter](https://github.com/wot-ui/wot-starter)
- [unibest](https://github.com/feige996/unibest)
- [uni-vitesse](https://github.com/Ares-Chang/uni-vitesse)

## 感谢

- [UnoCSS](https://github.com/unocss/unocss)

## License

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/zguolee) 和所有贡献者。
