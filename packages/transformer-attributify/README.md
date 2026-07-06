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
import transformerAttributify from '@unocss-applet/transformer-attributify'

import { defineConfig } from 'unocss'

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
  deleteAttributes?: boolean
}
```

## Example

> Attributes will be deleted unless `deleteAttributes` is set to `true`.

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

## JSX / TSX support

Besides `.vue`, this transformer also processes `.jsx` and `.tsx`. On the JSX side:

- Generated utilities are injected as `className` (not `class`) for React compatibility.
- A static `className="foo"` has utilities appended to its value; a dynamic `className={expr}` is
  rewritten into a template literal that preserves the runtime expression, e.g.
  `className={c} mt-2` → `` className={`${c} mt-2`} ``.
- Dynamic non-class attributes (e.g. `text={cond ? 'a' : 'b'}`) and spread attributes
  (`{...props}`) are skipped — they can't be statically compiled.
- Tokens containing `.` (e.g. `mt-2.5`) or `:` (e.g. `dark:text-red`) aren't valid bare JSX
  attribute names — JSX identifiers can't contain `.` or `:`. Put them through `className`
  instead.

Out of scope on the JSX side (the element matcher is regex-based, not a full JSX parser):

- Fragment short syntax (`<>...</>`) isn't matched.
- String or comment children that look like tags (e.g. a string child `'<div>'`, or a JSX
  comment containing `<foo>`) may be misread as real tags. Keep such content out of
  hand-written templates this transformer runs on.
- A `>` inside any attribute expression is treated as the tag's closing `>`, so an element
  whose attribute expression contains `>` — arrow functions (`onClick={() => fn()}`),
  comparison operators (`disabled={a > b}`), or `<`/`>` inside string literals — is matched
  only up to that `>` and silently skipped: utilities on that element are dropped without an
  error. This is the most common gotcha in real Taro/React code. To avoid the drop, move
  utilities on such elements into a literal `className="..."`.

## License

MIT License &copy; 2022-PRESENT [Neil Lee](https://github.com/zguolee)
