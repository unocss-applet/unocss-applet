# @unocss-applet/transformer-attributify

Attributify Mode for [UnoCSS](https://github.com/unocss/unocss).

## Instal

```bash
npm i @unocss-applet/transformer-attributify --save-dev # with npm
yarn add @unocss-applet/transformer-attributify -D # with yarn
pnpm add @unocss-applet/transformer-attributify -D # with pnpm
```

## Usage

```ts
import { defineConfig } from 'unocss'

import transformerAttributify from '@unocss-applet/transformer-attributify'

export default defineConfig({
  // ...
  transformers: [
    transformerAttributify(),
  ],
})
```

## Type Declarations

```ts
export interface TransformerAttributifyOptions {
  /**
   * @default 'un-'
   */
  prefix?: string

  /**
   * Only match for prefixed attributes
   *
   * @default false
   */
  prefixedOnly?: boolean

  /**
   * Support matching non-valued attributes
   *
   * For example
   * ```html
   * <div mt-2 />
   * ```
   *
   * @default true
   */
  nonValuedAttribute?: boolean

  /**
   * A list of attributes to be ignored from extracting.
   */
  ignoreAttributes?: string[]

  /**
   * Delete attributes that added in `class=""`
   * @default true
   */
  deleteClass?: boolean
}
```

## Example

> Attributes will be deleted unless `deleteClass` is set to `true`.

### without

```html
<div h-80 text-center flex flex-col align-center select-none all:transition-400>
  py-3
</div>
```

</td><td width="500px" valign="top">

### with

```html
<div class="h-80 text-center flex flex-col select-none all:transition-400">
  py-3
</div>
```

## License

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/zguolee)
