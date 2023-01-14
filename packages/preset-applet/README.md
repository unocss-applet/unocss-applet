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
// PresetMiniOptions https://github.com/unocss/unocss/blob/main/packages/preset-mini/src/index.ts#L30-L55
export interface PresetAppletOptions extends PresetMiniOptions {
  /**
   * Enable applet
   * @default true
   */
  enable?: boolean
}
```

## Change

| form | to      | sample                 |
| ---- | ------- | ---------------------- |
| [`*`](https://github.com/unocss/unocss/blob/main/packages/preset-mini/src/preflights.ts) | [`page`](./src/preflights.ts) | - |

> If you need to use a class selector that contains `[.:%!#()[\/\],]`, it needs to be used with [@unocss-applet/transformer-rename-class](../unocss-applet/)

## More

> Default enabled because for [issue#2](https://github.com/unocss-applet/unocss-applet/issues/2) in applet, to disable just set `enable: false`

| form | to      | sample                 |
| ---- | ------- | ---------------------- |
| `\.` | `-point-` | `p-0.5` -> `p-0-point-5` |
| `\/` | `-div-` | `p-1/2` -> `p-1-div-2` |
| `\:` | `-c-` | `dark:text-green-500` -> `dark-c-text-green-500` |
| `\%` | `-pct` | `opacity-10%` -> `opacity-10-pct` |
| `\!` | `i-` | `!bg-black` -> `i-bg-black` |
| `\#` | `-h-` | `bg-#121212` -> `bg--h-121212` |
| `\(` | `p-` | `bg-[hsl(2.7,81.9%,69.6%)]` -> `bg-[hslp-2.7,81.9%,69.6%)]` |
| `\)` | `-q` | `bg-[hsl(2.7,81.9%,69.6%)]` -> `bg-[hsl(2.7,81.9%,69.6%-q]` |
| `\[` | `l-` | `bg-[hsl(2.7,81.9%,69.6%)]` -> `bg-l-hsl(2.7,81.9%,69.6%)]` |
| `\]` | `-r` | `bg-[hsl(2.7,81.9%,69.6%)]` -> `bg-[hsl(2.7,81.9%,69.6%)-r` |
| `\,` | `-comma-` | `bg-[hsl(2.7,81.9%,69.6%)]` -> `bg-[hsl(2.7-comma-81.9%-comma-69.6%)]` |

## License

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/zguolee)
