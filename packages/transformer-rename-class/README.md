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


```html
// from
<div class="py-3.5 grid-cols-[0.7fr_repeat(7,1fr)]">
  py-3
</div>

// to
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


## License

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/zguolee)
