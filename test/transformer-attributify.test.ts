import type { SourceCodeTransformer } from '@unocss/core'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import transformerAttributify from '@unocss-applet/transformer-attributify'
import { createGenerator } from '@unocss/core'
import { presetAttributify } from '@unocss/preset-attributify'
import { presetIcons } from '@unocss/preset-icons'
import { presetWind3 } from '@unocss/preset-wind3'
import MagicString from 'magic-string'
import { describe, expect, it } from 'vitest'

// `id` is required — the transformer branches on `.vue` vs `.jsx`/`.tsx`, so a default
// would silently route JSX cases through the Vue path (or vice versa). Forcing callers
// to pass it makes the test's intent explicit.
async function transform(code: string, transformer: SourceCodeTransformer, id: string) {
  const s = new MagicString(code)

  const uno = await createGenerator({
    presets: [
      presetWind3(),
      presetIcons({
        scale: 1.2,
        cdn: 'https://esm.sh/',
      }),
      presetAttributify(),
    ],
    transformers: [
      transformer,
    ],
  })
  await transformer.transform(s, id, { uno, tokens: new Set() } as any)
  return s.toString()
}

describe('transformer-attributify', async () => {
  const content = await fs.readFile(
    path.resolve(__dirname, './fixtures/attributify.vue'),
  )

  it('basic', async () => {
    const transformer = transformerAttributify({ ignoreAttributes: ['block'] })
    const result = await transform(content.toString(), transformer, 'foo.vue')
    await expect(result).toMatchFileSnapshot('./fixtures/output/attributify.vue')
  })

  it('prefixed-only', async () => {
    const transformer = transformerAttributify({ prefixedOnly: true })
    const result = await transform(content.toString(), transformer, 'foo.vue')
    await expect(result).toMatchFileSnapshot('./fixtures/output/attributify-prefixed-only.vue')
  })
})

describe('transformer-attributify (jsx)', async () => {
  const content = await fs.readFile(
    path.resolve(__dirname, './fixtures/attributify.tsx'),
  )

  it('basic', async () => {
    const transformer = transformerAttributify({ ignoreAttributes: ['block'] })
    const result = await transform(content.toString(), transformer, 'foo.tsx')
    await expect(result).toMatchFileSnapshot('./fixtures/output/attributify.tsx')
  })

  it('prefixed-only', async () => {
    const transformer = transformerAttributify({ prefixedOnly: true })
    const result = await transform(content.toString(), transformer, 'foo.tsx')
    await expect(result).toMatchFileSnapshot('./fixtures/output/attributify-prefixed-only.tsx')
  })

  // `$` in user-controlled content (className expressions and static class values) must reach the
  // output literally. `String.prototype.replace(search, replacement)` interprets `$$`/`$&`/`$1`/
  // `$<name>` in `replacement`; the transformer now uses position-based slicing instead, which
  // can't interpret those patterns. A snapshot would catch gross corruption, but these explicit
  // assertions name the regression so a failure points directly at the cause.
  describe('$ literal preservation', () => {
    it('preserves `$` in a dynamic className template-literal expression', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className={`a$`} m-2 />',
        transformer,
        'foo.tsx',
      )
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output, not an interpolated template
      expect(result).toBe('<div className={`${`a$`} m-2`} />')
    })

    it('preserves `$&` in a dynamic className ternary expression', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className={x ? \'$&\' : y} m-2 />',
        transformer,
        'foo.tsx',
      )
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output, not an interpolated template
      expect(result).toBe('<div className={`${x ? \'$&\' : y} m-2`} />')
    })

    it('preserves `$&` in a static className value when appending utilities', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className="$&" m-2 />',
        transformer,
        'foo.tsx',
      )
      expect(result).toBe('<div className="$& m-2" />')
    })
  })

  // Regression: the old `String.replace`-based rewriting matched the FIRST substring occurrence,
  // so an unrelated attribute whose value happened to equal the class literal got rewritten
  // instead. Position-based edits anchor to the actual attribute. Verified for both Vue (`class`)
  // and JSX (`className`) since they share the append code path.
  describe('class value collision with another attribute', () => {
    it('vue: appends to `class`, not to a sibling attribute with the same value', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div data-foo="text-red" class="text-red" mt-2 />',
        transformer,
        'foo.vue',
      )
      expect(result).toBe('<div data-foo="text-red" class="text-red mt-2" />')
    })

    it('jsx: appends to `className`, not to a sibling attribute with the same value', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div data-foo="text-red" className="text-red" mt-2 />',
        transformer,
        'foo.tsx',
      )
      expect(result).toBe('<div data-foo="text-red" className="text-red mt-2" />')
    })
  })

  // Regression: the dynamic `className={expr}` rewrite used to assemble a target string and
  // `indexOf` it — landing on the first substring match, which could be a sibling attribute
  // whose value literally contains `className={expr}`. Position-anchored rewriting fixes it.
  // Mirror of the static-class collision test above, for the dynamic path.
  describe('dynamic class value collision with another attribute', () => {
    it('jsx: rewrites the dynamic className attribute, not a sibling whose value contains it', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div data-x="className={c}" className={c} m-2 />',
        transformer,
        'foo.tsx',
      )
      // `data-x` keeps its literal value verbatim; the real `className={c}` is wrapped.
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output, not an interpolated template
      expect(result).toBe('<div data-x="className={c}" className={`${c} m-2`} />')
    })
  })

  // Regression: value-less shorthand deletion used `replace(` ${name}`)`, which matched the
  // first occurrence of ` name` anywhere in the tag — including a substring of another
  // attribute name. Position-based deletion anchors to the actual attribute token.
  describe('value-less attribute name collision', () => {
    it('vue: deletes only the consumed shorthand, not a sibling whose name contains it', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div ma data-ma="x" />',
        transformer,
        'foo.vue',
      )
      // `ma` is consumed into `class`; `data-ma` (whose name contains `ma`) is untouched.
      // Position-based deletion anchored to the attribute token is what makes this work —
      // the old `replace(` ${name}`)` would have matched the ` ma` inside `data-ma`.
      expect(result).toBe('<div data-ma="x" class="ma"/>')
    })
  })

  // Regression: `scanBracedExpression` now skips quoted runs (string/template literals), so a
  // `}` inside a string no longer collapses the brace depth and truncates the expression.
  describe('quoted `}` inside JSX expression containers', () => {
    it('does not mis-balance on a `}` inside a string literal', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className={obj[\'}\']} mt-2 />',
        transformer,
        'foo.tsx',
      )
      // The full `{obj[\'}\'}` expression is preserved and utilities appended after it.
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output, not an interpolated template
      expect(result).toBe('<div className={`${obj[\'}\']} mt-2`} />')
    })
  })

  // Regression: an empty static `class=""` / `className=""` left the `?append?` sentinel in
  // the output AND injected a second class attribute, because the empty string was used as a
  // presence flag (and `''` is falsy). Tracked separately so neither symptom can return.
  describe('empty static class value', () => {
    it('jsx: appends utilities into the existing empty className without a sentinel or duplicate', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className="" m-2 />',
        transformer,
        'foo.tsx',
      )
      expect(result).toBe('<div className="m-2" />')
    })

    it('vue: appends utilities into the existing empty class without a sentinel or duplicate', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div class="" m-2 />',
        transformer,
        'foo.vue',
      )
      expect(result).toBe('<div class="m-2" />')
    })

    it('leaves the empty class untouched when no utilities are collected', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className="" text="not-a-util" />',
        transformer,
        'foo.tsx',
      )
      expect(result).toBe('<div className="" text="not-a-util" />')
    })
  })

  // Regression: the whitespace-collapse pass only tracked `'` and `"` quotes, so whitespace
  // inside JSX `{...}` expression containers — including the template literals this transformer
  // itself emits for dynamic className — was silently collapsed (e.g. `a   b` -> `a b`).
  describe('whitespace inside JSX expression containers is preserved', () => {
    it('preserves multiple spaces inside a template-literal className expression', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className={`a   b`} m-2 />',
        transformer,
        'foo.tsx',
      )
      // The inner `a   b` (3 spaces) must survive verbatim; only the orphan whitespace from
      // attribute deletions is collapsed.
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output, not an interpolated template
      expect(result).toBe('<div className={`${`a   b`} m-2`} />')
    })

    it('preserves a leading space inside a template-literal className expression', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className={` a b`} m-2 />',
        transformer,
        'foo.tsx',
      )
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output, not an interpolated template
      expect(result).toBe('<div className={`${` a b`} m-2`} />')
    })

    it('preserves multiple spaces inside a ternary string literal', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className={x ? \'a b\' : \'c  d\'} m-2 />',
        transformer,
        'foo.tsx',
      )
      // The `c  d` double space inside the ternary's string literal must survive.
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output, not an interpolated template
      expect(result).toBe('<div className={`${x ? \'a b\' : \'c  d\'} m-2`} />')
    })
  })

  // Documented limitation: `elementRE`'s `(?=.*>)` lookahead treats the first `>` inside a JSX
  // expression as the tag's closing `>`, so the element is matched only up to that `>` and
  // silently skipped — utilities on it are dropped without an error. Arrow functions
  // (`onClick={() => fn()}`) and comparison operators (`disabled={a > b}`) hit this in real
  // code. These tests lock the no-op behavior so a future change to the regex is forced to
  // decide explicitly whether to preserve or fix it.
  describe('attribute expression containing `>` is silently skipped', () => {
    it('arrow function prop drops the utility on the same element', async () => {
      const transformer = transformerAttributify()
      const src = '<div onClick={() => fn()} m-2 />'
      const result = await transform(src, transformer, 'foo.tsx')
      // Output equals input — `m-2` is NOT collected and no `className` is injected.
      expect(result).toBe(src)
    })

    it('comparison operator in a prop drops the utility on the same element', async () => {
      const transformer = transformerAttributify()
      const src = '<div disabled={a > b} m-2 />'
      const result = await transform(src, transformer, 'foo.tsx')
      expect(result).toBe(src)
    })
  })

  // Option behavior not covered by the snapshot fixtures: `deleteAttributes: false` must keep
  // the consumed shorthand attributes in place while still injecting the composed class.
  describe('deleteAttributes: false', () => {
    it('keeps shorthand attributes and still injects class', async () => {
      const transformer = transformerAttributify({ deleteAttributes: false })
      const result = await transform('<div m-2 text-red />', transformer, 'foo.tsx')
      expect(result).toBe('<div m-2 text-red className="m-2 text-red"/>')
    })
  })

  // Regression: the dynamic `className={expr}` span used a hardcoded `name.length + 1`, which
  // undershot when `=` had surrounding spaces (`className = {c}`). The replacement then ended
  // inside the expression, leaving the trailing chars (`c}`) outside the template literal and
  // producing invalid JSX. Anchoring the span on `contentOffset` instead fixes both cases.
  describe('spaces around `=` in dynamic className', () => {
    it('preserves the full expression when `=` has surrounding spaces', async () => {
      const transformer = transformerAttributify()
      const result = await transform('<div className = {c} m-2 />', transformer, 'foo.tsx')
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output, not an interpolated template
      expect(result).toBe('<div className={`${c} m-2`} />')
    })
  })

  // Regression: a JSX spread `{...{ a: flex }}` was tokenised WITHOUT the leading `{`, so the
  // spread's inner identifier `flex` (a valid utility) was consumed as a utility and deleted
  // from the spread object — silently corrupting runtime code. The transformer now detects the
  // `{` per-token inside the attribute loop, scans the full braced container, and marks its span
  // consumed so inner tokens are skipped. Spreads may appear anywhere in the attribute list, not
  // only first — see `mid-tag spread attributes` below.
  describe('spread attributes with utility-named inner identifiers', () => {
    it('does not consume or delete a utility-named key from the spread object', async () => {
      const transformer = transformerAttributify()
      const result = await transform('<div {...{ a: flex }} text-red />', transformer, 'foo.tsx')
      // `flex` stays inside the spread; only `text-red` is collected.
      expect(result).toBe('<div {...{ a: flex }} className="text-red"/>')
    })

    it('does not consume or delete multiple utility-named keys', async () => {
      const transformer = transformerAttributify()
      const result = await transform('<div {...{ flex: 1, block: 2 }} text-red />', transformer, 'foo.tsx')
      expect(result).toBe('<div {...{ flex: 1, block: 2 }} className="text-red"/>')
    })

    it('unspaced identifier spread is preserved', async () => {
      const transformer = transformerAttributify()
      const result = await transform('<div {...props} text-red />', transformer, 'foo.tsx')
      expect(result).toBe('<div {...props} className="text-red"/>')
    })
  })

  // Regression (P0): the spread pre-scan only fired when the spread was the FIRST attribute, so
  // a spread appearing later in the tag (`<Comp className="x" {...rest} />`) fell through with
  // its leading `{` dropped. Inner tokens were then yielded as strays and consumed as utilities,
  // deleting them from the spread object — `<div {...{ a: flex }} text-red />` produced
  // `{ a: , b: }`. Spreads are common mid-tag (e.g. after a static className), so this would
  // silently break runtime code. Per-token detection now handles spreads at any position.
  describe('mid-tag spread attributes', () => {
    it('does not corrupt a spread after a static className (single utility-named value)', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className="x" {...{ a: flex }} text-red />',
        transformer,
        'foo.tsx',
      )
      // `flex` stays in the spread object; `text-red` appends to the static className.
      expect(result).toBe('<div className="x text-red" {...{ a: flex }} />')
    })

    it('does not corrupt multiple utility-named values in a mid-tag spread', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className="x" {...{ a: flex, b: block }} text-red />',
        transformer,
        'foo.tsx',
      )
      expect(result).toBe('<div className="x text-red" {...{ a: flex, b: block }} />')
    })

    it('does not consume the spread identifier when mid-tag and unspaced', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className="x" {...rest} m-2 />',
        transformer,
        'foo.tsx',
      )
      expect(result).toBe('<div className="x m-2" {...rest} />')
    })

    it('collects outer utilities when a value-less shorthand precedes the spread', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div first {...rest} m-2 />',
        transformer,
        'foo.tsx',
      )
      // `first` isn't a utility so it survives; `m-2` is collected and injected as className.
      // `rest` stays intact.
      expect(result).toBe('<div first {...rest} className="m-2"/>')
    })

    it('handles multiple spreads across the attribute list', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div {...a} {...b} text-red />',
        transformer,
        'foo.tsx',
      )
      expect(result).toBe('<div {...a} {...b} className="text-red"/>')
    })

    it('handles a quoted `}` inside a mid-tag spread object literal', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className="x" {...{ a: "}" }} text-red />',
        transformer,
        'foo.tsx',
      )
      // The `}` inside the string literal must not collapse the brace depth.
      expect(result).toBe('<div className="x text-red" {...{ a: "}" }} />')
    })
  })

  // Regression: when a value-less attribute's name equals the tag name and it is the only
  // attribute, `attrSeg` (`"flex "`) is a substring of `<flex `, so `indexOf(attrSeg)` landed
  // on the tag name and the deletion edit ate the tag's leading characters
  // (`<flex flex />` -> `< flex className="flex"/>`). The offset is now derived from the first
  // whitespace (the tag/attribute separator), not from `indexOf(attrSeg)`.
  describe('tag name equals value-less attribute name', () => {
    it('vue: does not corrupt the tag name when the only attribute shares its name', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<flex flex />',
        transformer,
        'foo.vue',
      )
      expect(result).toBe('<flex class="flex"/>')
    })

    it('jsx: does not corrupt the tag name when the only attribute shares its name', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<flex flex />',
        transformer,
        'foo.tsx',
      )
      expect(result).toBe('<flex className="flex"/>')
    })
  })

  // Strengthens the `quoted } inside JSX expression containers` test above: that case has no
  // internal whitespace, so `\S+` captures the whole `{...}` and `scanBracedExpression` (with
  // `skipQuoted`) is never invoked. This variant forces internal whitespace, which truncates
  // the `\S+` capture and routes through the brace scanner — the path where `skipQuoted` matters.
  describe('quoted `}` inside a whitespace-bearing JSX expression container', () => {
    it('does not mis-balance on a `}` inside a string literal within a ternary', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className={x ? \'}\' : y} mt-2 />',
        transformer,
        'foo.tsx',
      )
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output
      expect(result).toBe('<div className={`${x ? \'}\' : y} mt-2`} />')
    })
  })
})
