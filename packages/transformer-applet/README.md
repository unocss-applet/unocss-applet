# @unocss-applet/transformer-applet

Convert selectors not supported by the applet.

## Instal

```bash
npm i @unocss-applet/transformer-applet --save-dev # with npm
yarn add @unocss-applet/transformer-applet -D # with yarn
pnpm add @unocss-applet/transformer-applet -D # with pnpm
```

## Usage

> Only effect when class selector name include `[.:%!#()[\/\],]`.

```ts
import { defineConfig } from 'unocss'

import transformerApplet from '@unocss-applet/transformer-applet'

export default defineConfig({
  // ...
  transformers: [
    transformerApplet(),
  ],
})
```

## Type Declarations

```ts
export interface TransformerAppletOptions {
  /**
   * The layer name of generated rules
   * @default 'applet_shortcuts'
   */
  layer?: string

  /**
   * Unsupported characters in applet, will be added to the default value
   * @default ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$', '{', '}', '@', '+', '^', '&', '<', '>']
   */
  unsupportedChars?: string[]
}
```

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
