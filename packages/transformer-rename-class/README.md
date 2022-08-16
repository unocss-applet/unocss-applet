# @unocss-applet/transformer-rename-class

Coverts class selector name to hash.

## Instal

```bash
npm i @unocss-applet/transformer-rename-class --save-dev # with npm
yarn add @unocss-applet/transformer-rename-class -D # with yarn
pnpm add @unocss-applet/transformer-rename-class -D # with pnpm
```

## Usage

> Only effect when class selector name include `[.:%!#()[\/\],]`. 

```ts
import { defineConfig } from 'unocss'

import transformerRenameClass from '@unocss-applet/transformer-rename-class'

export default defineConfig({
  // ...
  transformers: [
    transformerRenameClass(),
  ],
})
```

## Example
### Using in with `class`
#### without

```html
<div class="py-3.5 grid-cols-[0.7fr_repeat(7,1fr)]">
  py-3
</div>
```

</td><td width="500px" valign="top">

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

If you want to use string(`const bg = 'bg-green-100/50'`) in `<script></script>` and `JS/TS` files, please use single quotes instead of double quotes.

#### without

```html
<script setup lang="ts">
  const bg = 'bg-[hsl(2.7,81.9%,69.6%)]'
</script>
```

#### with

```html
<script setup lang="ts">
  const bg = 'uno-98db2v'
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
