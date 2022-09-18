# unocss-applet

Using [UnoCSS](https://github.com/unocss/unocss) in applet(for [UniApp](https://github.com/dcloudio/uni-app) and [Taro(WIP)](https://github.com/NervJS/taro)) to be compatible with unsupported syntax.

## Presets and Plugins

- [unocss-applet](https://github.com/unocss-applet/unocss-applet/tree/main/packages/unocss-applet) - The default package with common presets and plugins

- [@unocss-applet/preset-applet](https://github.com/unocss-applet/unocss-applet/tree/main/packages/preset-applet) - The default preset (right now it's equivalent to `@unocss/preset-uno`)
- [@unocss-applet/preset-rem-to-rpx](https://github.com/unocss-applet/unocss-applet/tree/main/packages/preset-rem-to-rpx) - Coverts rem to rpx for utils.
- [@unocss-applet/transformer-applet](https://github.com/unocss-applet/unocss-applet/tree/main/packages/transformer-applet) - Compile classes that do not support applets into one class.
- [@unocss-applet/transformer-attributify](https://github.com/unocss-applet/unocss-applet/tree/main/packages/transformer-attributify) - Enables Attributify Mode for applet.

## Instal

```bash
npm i unocss-applet --save-dev # with npm
yarn add unocss-applet -D # with yarn
pnpm add unocss-applet -D # with pnpm
```

## Usage

<details>
<summary>For UniApp</summary><br>

```ts
// unocss.config.ts
import type { Preset, SourceCodeTransformer } from 'unocss'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

import {
  presetApplet,
  presetRemToRpx,
  transformerApplet,
  transformerAttributify,
} from 'unocss-applet'

const presets: Preset[] = []
const transformers: SourceCodeTransformer[] = []

if (process.env.UNI_PLATFORM === 'h5') {
  presets.push(presetUno())
  presets.push(presetAttributify())
}
else {
  presets.push(presetApplet())
  presets.push(presetRemToRpx())

  // don't change the order
  transformers.push(transformerAttributify())
  transformers.push(transformerApplet())
}

export default defineConfig({
  presets: [
    presetIcons(),
    /**
     * you can add `presetAttributify()` here to enable unocss attributify mode prompt
     * although preset is not working for applet
     */
    // presetAttributify(),
    ...presets,
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
    ...transformers,
  ],
})
```

<br></details>

<details>
<summary>For Taro(WIP)</summary><br>

<br></details>

## Example

- [starter-uni](https://github.com/zguolee/starter-uni)
- [ColorTimetable](https://github.com/zguolee/ColorTimetable)

## Acknowledgement

- [UnoCSS](https://github.com/unocss/unocss)

## License

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/zguolee)
