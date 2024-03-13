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
import { presetApplet } from '@unocss-applet/preset-applet'

export default defineConfig({
  presets: [
    presetApplet(),
  ],
})
```

## Type Declarations

```ts
// PresetUnoOptions https://github.com/unocss/unocss/blob/main/packages/preset-uno/src/index.ts#L9
// PresetMiniOptions https://github.com/unocss/unocss/blob/main/packages/preset-mini/src/index.ts#L33-L73
export interface PresetAppletOptions extends PresetUnoOptions {
  /**
   * Unsupported characters in applet, will be added to the default value
   * @default ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$', '{', '}', '@', '+', '^', '&', '<', '>', '\'', '\\', '*']
   */
  unsupportedChars?: string[]

  /**
   * Space Between and Divide Width Elements
   * @default ['view', 'button', 'text', 'image']
   */
  betweenElements?: string[]
}
```

## Change

- The `*` selector will be replaced with `page` in the generated class name.
- the unsupported characters in applet will be replaced with `_a_` in the generated class name.

## Example

### Using in with `class`

#### without

```html
<div class="py-3.5 grid-cols-[0.7fr_repeat(7,1fr)]">
  py-3
</div>
```

#### with

```html
<div class="py-3_a_5 grid-cols-_a_0_a_7fr_repeat_a_7_a_1fr_a__a_">
  py-3
</div>

<style>
.grid-cols-_a_0_a_7fr_repeat_a_7_a_1fr_a__a_ {
  grid-template-columns: 0.7fr repeat(7,1fr);
}

.py-3_a_5 {
  padding-top:0.875rem;padding-bottom: 0.875rem;
}
</style>
```

### Using with string

If you want to ignore a string, add a prefix(default `applet-ignore:`), and the plugin will automatically ignore the string and delete the prefix.

#### without

```html
<script setup lang="ts">
  const bg = 'bg-[hsl(2.7,81.9%,69.6%)]'
  const bg2 = 'applet-ignore: bg-[hsl(2.7,81.9%,69.6%)]'
</script>
```

#### with

```html
<script setup lang="ts">
  const bg = 'bg-_a_hsl_a_2_a_7_a_81_a_9_a__a_69_a_6_a__a__a_'
  const bg2 = 'bg-[hsl(2.7,81.9%,69.6%)]'
</script>

<style>
.bg-_a_hsl_a_2_a_7_a_81_a_9_a__a_69_a_6_a__a__a_ {
  --un-bg-opacity: 1;
  background-color: hsla(2.7, 81.9%, 69.6%, var(--un-bg-opacity));
}
</style>
```

## License

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/zguolee)
