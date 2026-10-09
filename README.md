<p align="center">
<img src="https://github.com/unocss-applet/unocss-applet/raw/main/public/logo.svg" alt="UnoCSS Applet logo" width="100" />
<h1 align="center">UnoCSS Applet</h1>
<p align="center">在小程序(<a href="https://github.com/dcloudio/uni-app">UniApp</a> 和 <a href="https://github.com/NervJS/taro">Taro</a>)中使用<a href="https://github.com/unocss/unocss">UnoCSS</a>，兼容不支持的语法。</p>
</p>
<p align="center">
<a href="https://github.com/unocss-applet/unocss-applet/blob/main/LICENSE"><img src="https://img.shields.io/github/license/unocss-applet/unocss-applet.svg?style=flat&colorA=858585&colorB=F17F42" alt="License"></a>
<a href="https://github.com/unocss-applet/unocss-applet/stargazers"><img src="https://img.shields.io/github/stars/unocss-applet/unocss-applet?style=flat&colorA=858585&colorB=F17F42" alt="Stars"></a>
<a href="https://www.npmjs.com/package/unocss-applet"><img src="https://img.shields.io/npm/v/unocss-applet?style=flat&colorA=858585&colorB=F17F42" alt="NPM version"></a>
<a href="https://www.npmjs.com/package/unocss-applet"><img src="https://img.shields.io/npm/dm/unocss-applet?style=flat&colorA=858585&colorB=F17F42" alt="NPM Downloads"></a>
<a href="https://bundlephobia.com/result?p=unocss-applet"><img src="https://img.shields.io/bundlephobia/minzip/unocss-applet?style=flat&colorA=858585&colorB=F17F42" alt="Bundle"></a>
<a href="https://deepwiki.com/unocss-applet/unocss-applet"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
</p>
<p align="center">
<a href="https://github.com/nei1ee"><img src="https://img.shields.io/badge/Author-Neil%20Lee-blue?style=flat" alt="Author"></a>
</p>

## 预设和插件

- [unocss-applet](https://github.com/unocss-applet/unocss-applet/tree/main/packages/unocss-applet) - 主包，聚合所有预设和插件，完整使用文档见[其 README](./packages/unocss-applet)。
- [@unocss-applet/preset-applet](https://github.com/unocss-applet/unocss-applet/tree/main/packages/preset-applet) - 默认预设，包裹 `@unocss/preset-wind3`（默认）/ `@unocss/preset-wind4`。
- [@unocss-applet/preset-rem-rpx](https://github.com/unocss-applet/unocss-applet/tree/main/packages/preset-rem-rpx) - 转换rem <=> rpx的工具。
- [@unocss-applet/transformer-attributify](https://github.com/unocss-applet/unocss-applet/tree/main/packages/transformer-attributify) - 为小程序启用 Attributify 模式。
- [@unocss-applet/transformer-hover](https://github.com/unocss-applet/unocss-applet/tree/main/packages/transformer-hover) - 把 `hover:` 工具类改写到原生 `hover-class` 属性。
- [@unocss-applet/reset](https://github.com/unocss-applet/unocss-applet/tree/main/packages/reset) - CSS 样式重置集合。

> 各 preset / transformer 与上游 UnoCSS 的兼容关系、不支持项、各版本对应表及变通方案见 [COMPATIBILITY.md](./COMPATIBILITY.md)。

## 安装

```bash
npm i unocss-applet --save-dev # with npm
yarn add unocss-applet -D # with yarn
pnpm add unocss-applet -D # with pnpm
```

## 兼容性

`unocss-applet` 当前已验证支持 UnoCSS `~66.10.1`（`peerDependencies` 锁定），需要 Node.js `>= 22.12`。

## 使用

```ts
// uno.config.ts
import { defineConfig } from 'unocss'
import {
  presetApplet,
  presetRemRpx,
  transformerAttributify,
  transformerHover,
} from 'unocss-applet'

export default defineConfig({
  presets: [presetApplet(), presetRemRpx()],
  transformers: [transformerAttributify(), transformerHover()],
})
```

小程序 / H5 的分支配置、uni-app 与 Taro 的平台接入、各选项的完整说明，请阅读主包 [packages/unocss-applet](./packages/unocss-applet) 的文档。

## 示例

仓库内集成示例（均启用了上游 `presetIcons`）：

- [`examples/uni-app`](./examples/uni-app) - uni-app + Vue3 + Vite
- [`examples/taro`](./examples/taro) - Taro 4.2 + React + Webpack5

社区示例：

- [vitesse-uni-app](https://github.com/uni-helper/vitesse-uni-app)
- [wot-starter](https://github.com/wot-ui/wot-starter)
- [unibest](https://github.com/feige996/unibest)
- [uni-vitesse](https://github.com/Ares-Chang/uni-vitesse)

## 参与贡献

参阅 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 感谢

- [UnoCSS](https://github.com/unocss/unocss)

## License

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/nei1ee) 和所有贡献者。
