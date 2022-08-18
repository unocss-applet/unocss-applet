# unocss-applet

Using [UnoCSS](https://github.com/unocss/unocss) in Applet(uniapp...).

## Instal

```bash
npm i unocss-applet --save-dev # with npm
yarn add unocss-applet -D # with yarn
pnpm add unocss-applet -D # with pnpm
```

## Usage

```ts
import { defineConfig } from 'unocss'

import { presetApplet, presetRemToRpx, transformerRenameClass } from 'unocss-applet'

export default defineConfig({
  presets: [
    presetApplet(),
    presetRemToRpx(),
  ],
  transformers: [
    transformerRenameClass(),
  ],
})
```

## Acknowledgement
- [UnoCSS](https://github.com/unocss/unocss)

## License

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/zguolee)
