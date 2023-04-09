# @unocss-applet/preset-applet

The Applet preset for [UnoCSS](https://github.com/unocss/unocss), fork from [@unocss/preset-uno](https://github.com/unocss/unocss/tree/main/packages/preset-uno) and modified to transform some CSS selector.

## Install

```bash
npm i @unocss-applet/preset-applet --save-dev # with npm
yarn add @unocss-applet/preset-applet -D # with yarn
pnpm add @unocss-applet/preset-applet -D # with pnpm
```

## Usage

```ts
import presetApplet from '@unocss-applet/preset-applet'

export default defineConfig({
  presets: [
    presetApplet(),
  ],
})
```

## Type Declarations

```ts
// PresetUnoOptions https://github.com/unocss/unocss/blob/main/packages/preset-uno/src/index.ts#L9
// PresetMiniOptions https://github.com/unocss/unocss/blob/main/packages/preset-mini/src/index.ts#L30-L55
export interface PresetAppletOptions extends PresetUnoOptions {
  /**
   * Enable applet
   * @default true
   */
  enable?: boolean

  /**
   * Unsupported characters in applet, will be added to the default value
   * @default ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$', '{', '}', '@', '+', '^', '&', '<', '>']
   */
  unsupportedChars?: string[]
}
```

## Change

- The `*` selector will be replaced with `page` in the generated class name.
- the unsupported characters in applet will be replaced with `_a_` in the generated class name.

## More

Default enabled because for [issue#2](https://github.com/unocss-applet/unocss-applet/issues/2) in applet, to disable just set `enable: false`

## License

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/zguolee)
