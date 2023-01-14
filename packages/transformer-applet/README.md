# @unocss-applet/transformer-applet

Coverts class selector name to hash.

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
   * Enable transformer applet
   * @default true
   */
  enable?: boolean

  /**
   * Prefix for compile class name
   * @default 'uno-'
   * e.g. bg-[hsl(2.7,81.9%,69.6%)] to uno-98db2v
   */
  classPrefix?: string

  /**
   * Prefix for ignore compile string
   * If the string contains ignore prefix, it will be replaced with an empty string.
   * e.g. 'applet-ignore: bg-[hsl(2.7,81.9%,69.6%)]' to 'bg-[hsl(2.7,81.9%,69.6%)]'
   * @default 'applet-ignore:'
   */
  ignorePrefix?: string

  /**
   * Hash function
   */
  hashFn?: (str: string) => string

  /**
   * The layer name of generated rules
   * @default 'applet_shortcuts'
   */
  layer?: string
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
<div class="uno-0tr0xg">
  py-3
</div>

<style>
.uno-0tr0xg {
  grid-template-columns:0.7fr repeat(7,1fr);
  padding-top:0.875rem;
  padding-bottom:0.875rem;
}
</style>
```

### Using with string

If you want to use UnoCSS rule string(`const bg = 'bg-green-100/50'`) in `<script></script>` or `JS/TS` files, please use single quotes instead of double quotes.
But if you want to ignore a string, add a prefix(default `applet-ignore:`), and the plugin will automatically ignore the string and delete the prefix.

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
  const bg = 'uno-98db2v'
  const bg2 = 'bg-[hsl(2.7,81.9%,69.6%)]'
</script>

<style>
.uno-98db2v {
  --un-bg-opacity: 1;
  background-color: hsla(2.7, 81.9%, 69.6%, var(--un-bg-opacity));
}
</style>
```

## License

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/zguolee)
