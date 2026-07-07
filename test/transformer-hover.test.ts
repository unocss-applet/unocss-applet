import type { SourceCodeTransformer } from '@unocss/core'
import transformerHover from '@unocss-applet/transformer-hover'
import { createGenerator } from '@unocss/core'
import { presetWind3 } from '@unocss/preset-wind3'
import MagicString from 'magic-string'
import { describe, expect, it } from 'vitest'

// `id` is required — the transformer branches on `.vue` vs `.jsx`/`.tsx`, picking the
// native attribute name (`hover-class` for Vue, `hoverClass` for JSX). A default would
// silently route JSX cases through the Vue path.
async function transform(code: string, transformer: SourceCodeTransformer, id: string) {
  const s = new MagicString(code)

  const uno = await createGenerator({
    presets: [presetWind3()],
    transformers: [transformer],
  })
  await transformer.transform(s, id, { uno, tokens: new Set() } as any)
  return s.toString()
}

describe('transformer-hover (vue)', () => {
  it('issue #19 example 1: moves hover: utilities from class to hover-class', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="hover:bg-red hover:text-xl"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div hover-class="bg-red text-xl"/>')
  })

  it('issue #19 example 2: merges with an existing static hover-class', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="hover:bg-red" hover-class="text-xl"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div hover-class="text-xl bg-red"/>')
  })

  it('issue #19 example 3: wraps an existing dynamic :hover-class in a template literal', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="hover:bg-red" :hover-class="bool ? \'text-xl\' : \'text-sm\'"/>',
      transformer,
      'foo.vue',
    )
    // eslint-disable-next-line no-template-curly-in-string -- literal expected output
    expect(result).toBe('<div :hover-class="`${bool ? \'text-xl\' : \'text-sm\'} bg-red`"/>')
  })

  it('preserves non-hover utilities in class', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="p-2 hover:bg-red text-white"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div class="p-2 text-white" hover-class="bg-red"/>')
  })

  it('leaves stacked variants (dark:hover:) in class untouched', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="dark:hover:bg-red hover:text-xl"/>',
      transformer,
      'foo.vue',
    )
    // dark:hover: stays; only standalone hover: moves.
    expect(result).toBe('<div class="dark:hover:bg-red" hover-class="text-xl"/>')
  })

  it('skips non-utility hover: tokens (leaves them in class)', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="hover:notarealutility hover:bg-red"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div class="hover:notarealutility" hover-class="bg-red"/>')
  })

  it('does not emit hover-class when there is nothing to move', async () => {
    const transformer = transformerHover()
    const result = await transform('<div class="p-2 text-white"/>', transformer, 'foo.vue')
    expect(result).toBe('<div class="p-2 text-white"/>')
  })

  it('does not process dynamic :class bindings', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div :class="x ? \'hover:bg-red\' : \'\'"/>',
      transformer,
      'foo.vue',
    )
    // Dynamic class expressions can't be statically parsed; left untouched (documented limit).
    expect(result).toBe('<div :class="x ? \'hover:bg-red\' : \'\'"/>')
  })

  it('removes the class attribute entirely when it becomes empty', async () => {
    const transformer = transformerHover()
    const result = await transform('<div class="hover:bg-red"/>', transformer, 'foo.vue')
    expect(result).toBe('<div hover-class="bg-red"/>')
  })

  // Regression: empty source must not crash (MagicString rejects zero-length overwrites).
  it('handles an empty file without throwing', async () => {
    const transformer = transformerHover()
    const result = await transform('', transformer, 'foo.vue')
    expect(result).toBe('')
  })

  // Regression: a file with no eligible elements is left untouched (no needless overwrite).
  it('leaves a file with no hover: utilities unchanged', async () => {
    const transformer = transformerHover()
    const result = await transform('<div class="p-2">hello</div>', transformer, 'foo.vue')
    expect(result).toBe('<div class="p-2">hello</div>')
  })

  // Regression: preserve the original quote char of a Vue dynamic binding whose expression
  // contains the opposite quote, so the wrapper doesn't collide and corrupt the markup.
  it('preserves the original quote of a dynamic :hover-class binding', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="hover:bg-red" :hover-class=\'cond ? "a" : "b"\'/>',
      transformer,
      'foo.vue',
    )
    // eslint-disable-next-line no-template-curly-in-string -- literal expected output
    expect(result).toBe('<div :hover-class=\'`${cond ? "a" : "b"} bg-red`\'/>')
  })

  // Regression: a value-less `hover-class` shorthand is rewritten to a valued form, not
  // duplicated.
  it('rewrites a value-less hover-class shorthand instead of duplicating it', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="hover:bg-red" hover-class/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div hover-class="bg-red"/>')
  })

  // Regression: a tab or newline between the tag name and the first attribute must not
  // corrupt the source (the offset is computed via `search(/\s/)`, not `indexOf(' ')`).
  it('handles a tab between tag name and first attribute', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div\tclass="hover:bg-red"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div hover-class="bg-red"/>')
  })

  it('handles a newline between tag name and first attribute', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div\nclass="hover:bg-red"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div hover-class="bg-red"/>')
  })

  // Regression: a leading `!` important modifier is preserved when moving the token
  // (`!hover:bg-red` and `hover:!bg-red` are the same rule in UnoCSS).
  it('preserves a leading important modifier (!hover:bg-red)', async () => {
    const transformer = transformerHover()
    const result = await transform('<div class="!hover:bg-red"/>', transformer, 'foo.vue')
    expect(result).toBe('<div hover-class="!bg-red"/>')
  })

  // Sanity: arbitrary-value bodies whose own `:` is inside `[...]` (not a variant
  // separator) are still moved.
  it('moves arbitrary-value hover: bodies (colon inside [...])', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="hover:bg-[url(http://x.png)]"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div hover-class="bg-[url(http://x.png)]"/>')
  })

  // Regression: pseudo-class / pseudo-element / peer variants as a `hover:` body are NOT
  // moved — `hover-class` can't gate on focus/active/peer, and moving them would drop the
  // qualifier. These compile to a single compound selector (no whitespace / `@media`), so a
  // selector-shape check would miss them; the top-level-colon heuristic catches them.
  it.each([
    'hover:focus:bg-red',
    'hover:active:bg-red',
    'hover:disabled:bg-red',
    'hover:checked:bg-red',
    'hover:first:bg-red',
    'hover:before:bg-red',
    'hover:peer-focus:bg-red',
    'hover:hover:bg-red',
    'hover:dark:bg-red',
    'hover:md:bg-red',
  ])('leaves %s in class (variant qualifier not expressible in hover-class)', async (tok) => {
    const transformer = transformerHover()
    const result = await transform(
      `<div class="${tok}"/>`,
      transformer,
      'foo.vue',
    )
    expect(result).toBe(`<div class="${tok}"/>`)
  })

  // Regression: multiple `class` attributes (malformed but tolerated) — every class attribute
  // is stripped of its `hover:` tokens, not just the last one. Without per-slot edits, earlier
  // class attributes kept a stale duplicate of the moved tokens. Here both class attributes
  // become empty and are dropped entirely.
  it('strips hover: tokens from all class attributes when multiple exist', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="hover:bg-red" class="hover:text-xl"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div hover-class="bg-red text-xl"/>')
  })

  it('strips hover: tokens from multiple class attrs with mixed content', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="p-2 hover:bg-red" class="m-4 hover:text-xl"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div class="p-2" class="m-4" hover-class="bg-red text-xl"/>')
  })

  // Regression: a doubly-important token (`!hover:!bg-red`) is invalid; the transformer must
  // leave it in place rather than re-emit it as a different invalid token (`!!bg-red`).
  it('leaves an invalid doubly-important !hover:!bg-red token in place', async () => {
    const transformer = transformerHover()
    const result = await transform('<div class="!hover:!bg-red"/>', transformer, 'foo.vue')
    expect(result).toBe('<div class="!hover:!bg-red"/>')
  })
})

describe('transformer-hover (jsx)', () => {
  it('uses hoverClass and className on JSX, moves hover: utilities', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div className="hover:bg-red hover:text-xl"/>',
      transformer,
      'foo.tsx',
    )
    expect(result).toBe('<div hoverClass="bg-red text-xl"/>')
  })

  it('merges with an existing static hoverClass', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div className="hover:bg-red" hoverClass="text-xl"/>',
      transformer,
      'foo.tsx',
    )
    expect(result).toBe('<div hoverClass="text-xl bg-red"/>')
  })

  it('wraps an existing dynamic hoverClass={expr} in a template literal', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div className="hover:bg-red" hoverClass={cond ? \'text-xl\' : \'text-sm\'}/>',
      transformer,
      'foo.tsx',
    )
    // eslint-disable-next-line no-template-curly-in-string -- literal expected output
    expect(result).toBe('<div hoverClass={`${cond ? \'text-xl\' : \'text-sm\'} bg-red`}/>')
  })

  it('preserves non-hover utilities in className', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div className="p-2 hover:bg-red"/>',
      transformer,
      'foo.tsx',
    )
    expect(result).toBe('<div className="p-2" hoverClass="bg-red"/>')
  })

  it('does not process dynamic className={expr} bindings', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div className={x ? \'hover:bg-red\' : \'\'}/>',
      transformer,
      'foo.tsx',
    )
    expect(result).toBe('<div className={x ? \'hover:bg-red\' : \'\'}/>')
  })

  // Regression: value-less hoverClass shorthand rewritten to a valued form.
  it('rewrites a value-less hoverClass shorthand instead of duplicating it', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div className="hover:bg-red" hoverClass/>',
      transformer,
      'foo.tsx',
    )
    expect(result).toBe('<div hoverClass="bg-red"/>')
  })
})
