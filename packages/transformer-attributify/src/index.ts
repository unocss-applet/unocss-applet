import type { SourceCodeTransformer } from '@unocss/core'
import type { TransformerAttributifyOptions } from './types'
import { isValidSelector } from '@unocss/core'
import MagicString from 'magic-string'

export * from './types'

/**
 * Attributify mode for applets (uni-app / Taro on the mini-program side).
 *
 * Unlike upstream `@unocss/preset-attributify` — which works at runtime via attribute
 * selectors like `[un-text='']` — applets can't use attribute selectors in wxss. This
 * transformer instead compiles attributify usage in the template into plain `class="..."`
 * at build time, e.g. `<view text="red" mt-2 />` -> `<view class="text-red mt-2" />`.
 *
 * Scope: `.vue` (uni-app / Taro-vue) and `.jsx`/`.tsx` (Taro React) files. JSX dynamic
 * expressions (`text={cond ? 'a' : 'b'}`, `{...spread}`) can't be statically compiled, so
 * only static attributes and value-less shorthand are handled on the JSX side.
 *
 * Out of scope on the JSX side (the regex-based element matcher isn't a full JSX parser):
 * - Fragment short syntax `<` + `>...</` + `>` — not matched (no leading `\w`).
 * - String/comment children that look like tags (e.g. a string child `'<div>'`, or a JSX
 *   comment containing `<foo>`) may be misread as real tags. Keep such content out of
 *   templates, or run this transformer only on hand-written markup where it isn't a concern.
 * - A `>` inside any JSX expression container is treated as the tag's closing `>`, so an
 *   element whose attribute expression contains `>` — arrow functions (`onClick={() => fn()}`),
 *   comparison operators (`disabled={a > b}`), or `<`/`>` inside string literals — is matched
 *   only up to that `>` and silently skipped (utilities on that element are dropped without
 *   error). This is the most common gotcha in real Taro/React code; move utilities on such
 *   elements into a literal `className="..."` to avoid the drop.
 */
const splitterRE = /[\s'"`;]+/g
// Contract: capture group 1 MUST be the full attribute segment, spanning from the first
// attribute after the tag name through the last attribute before the closing `/?>`. The
// attribute-loop below computes the group's offset into the full match via `indexOf(attrSeg)`
// and maps regex indices from attrSeg-space into match-space — both depend on this invariant.
// Any change here (new capture groups, trimming the segment) requires re-verifying segOffset.
function genElementRE(ignoreTagPrefixes: string[] = []): RegExp {
  if (!ignoreTagPrefixes.length)
    // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/no-dupe-disjunctions
    return /<\w(?=.*>)[\w:.$-]*\s(((".*?>?.*?")|.*?)*?)\/?>/gs

  const patterns = ignoreTagPrefixes.flatMap((prefix) => {
    const baseLower = prefix.toLowerCase()
    const capitalized = baseLower.charAt(0).toUpperCase() + baseLower.slice(1)
    const hyphenated = `${baseLower}-`

    return [capitalized, hyphenated]
  })

  // `ignoreTagPrefixes` is non-empty here (early-returned above), and `flatMap` over it yields
  // ≥2 entries per prefix, so `patterns` is always non-empty — no empty-lookahead branch needed.
  const ignorePattern = `(?!${patterns.join('|')})`
  return new RegExp(`<${ignorePattern}\\w(?=.*>)[\\w:.$-]*\\s(((".*?>?.*?")|.*?)*?)\\/?>`, 'gs')
}
// Captures unquoted JSX values with `\S+`, which truncates at the first whitespace inside a
// `{...}` expression container (`{a ? b : c}` → `{a`). JSX attribute handling re-extracts the
// full container via `scanBracedExpression` below; any change to this regex's value capture
// must be re-verified against that recovery layer.
// eslint-disable-next-line regexp/no-super-linear-backtracking
const attributeRE = /([[?\w\u00A0-\uFFFF-:()#%.\]]+)(?:\s*=\s*('[^']*'|"[^"]*"|\S+))?/g

/**
 * Skip a quoted run (`'...'`, `"..."`, or template `` `...` ``) inside an attribute value,
 * returning the index just past the closing quote. Template literals are single tokens at
 * this layer (no `${}` interpolation parsing) — the brace counter that calls this only needs
 * to know where the literal ends so its internal `{`/`}` aren't counted against the depth.
 * Returns `null` if the quote is never closed before `end`.
 */
function skipQuoted(seg: string, quoteStart: number, end: number): number | null {
  const quote = seg[quoteStart]
  for (let i = quoteStart + 1; i < end; i++) {
    if (seg[i] === '\\') {
      i++ // skip escaped char
      continue
    }
    if (seg[i] === quote)
      return i + 1
  }
  return null
}

/**
 * Scan a balanced `{...}` expression in `seg[braceStart..end)` starting at `braceStart`.
 *
 * `attributeRE` captures unquoted JSX values as `\S+`, which truncates at the first
 * whitespace inside a `{...}` expression container (e.g. `{cond ? 'a' : 'b'}` → `{cond`).
 * This re-extracts the full container by matching braces. Returns the slice `{...}`
 * including both braces, or `null` if braces are unbalanced (truncated source).
 *
 * String/template literals inside the expression are skipped via `skipQuoted`, so braces
 * within them (e.g. `'}'`, `${obj}`) don't throw off the depth counter. Nested template
 * `${...}` interpolation still isn't fully parsed — a `}` inside an interpolated expression
 * could still mis-balance — but that pattern is uncommon enough in className expressions
 * that this layer is sufficient in practice.
 */
function scanBracedExpression(seg: string, braceStart: number, end: number): string | null {
  if (seg[braceStart] !== '{')
    return null
  let depth = 0
  for (let i = braceStart; i < end; i++) {
    const ch = seg[i]
    if (ch === '\'' || ch === '"' || ch === '`') {
      const after = skipQuoted(seg, i, end)
      if (after === null)
        return null
      i = after - 1 // for-loop ++ brings us to the char after the closing quote
      continue
    }
    if (ch === '{') {
      depth++
    }
    else if (ch === '}') {
      depth--
      if (depth === 0)
        return seg.slice(braceStart, i + 1)
    }
  }
  return null
}

/** A pending position-based edit on `matchStrTemp`: replace `[start, end)` with `replacement`. */
interface AttrEdit { start: number, end: number, replacement: string }

const defaultIgnoreAttributes = ['placeholder', 'setup', 'lang', 'scoped']

export function transformerAttributify(options: TransformerAttributifyOptions = {}): SourceCodeTransformer {
  const ignoreAttributes = options?.ignoreAttributes ?? defaultIgnoreAttributes
  const nonValuedAttribute = options?.nonValuedAttribute ?? true
  const prefix = options.prefix ?? 'un-'
  const prefixedOnly = options.prefixedOnly ?? false
  const deleteAttributes = options.deleteAttributes ?? true
  const elementRE = genElementRE(options.ignoreTagPrefixes ?? [])

  return {
    name: 'transformer-attributify',
    enforce: 'pre',
    async transform(s, id, { uno }) {
      // process Vue SFCs and JSX/TSX; the regex assumes HTML-like template syntax
      if (!/\.(?:vue|[jt]sx)$/.test(id))
        return

      const isJsx = /\.(?:j|t)sx$/.test(id)

      const code = new MagicString(s.toString())

      const elementMatches = code.original.matchAll(elementRE)
      for (const eleMatch of elementMatches) {
        const start = eleMatch.index!
        let matchStrTemp = eleMatch[0]
        let hasStaticClass = false
        // static class literal captured only to decide whether appended utilities need a
        // leading space separator; presence is tracked by `hasStaticClass` above, since the
        // literal can be empty (and `''` is falsy, which would otherwise mis-flag absence).
        let staticClassValue = ''
        // For JSX dynamic `className={expr}` / `class={expr}`: record the attribute name, the
        // raw `{expr}` snippet, and the token's absolute span in matchStrTemp so utilities can
        // be appended via a template literal that preserves the runtime expression. The span is
        // kept so the rewrite is position-anchored rather than `indexOf`-based — the latter would
        // land on the first substring match and could corrupt a sibling attribute whose value
        // happens to contain `className={...}` (same first-match trap the static path avoids).
        let dynamicClassName = ''
        let dynamicClassContent = ''
        let dynamicClassStart = -1
        let dynamicClassEnd = -1
        const attrSelectors: string[] = []
        const attrSeg = eleMatch[1] || ''
        // `attributeRE` indices are relative to attrSeg; map them into matchStrTemp by adding
        // attrSeg's offset inside the full tag match. The element regex is `<\w[\w:.$-]*\s(...)`,
        // so the first whitespace is exactly the tag-name/attribute separator and attrSeg begins
        // right after it. `indexOf(attrSeg)` would be wrong when a value-less attribute's name
        // equals the tag name (e.g. `<flex flex />`): attrSeg `"flex "` then also matches inside
        // `<flex `, landing the offset on the tag name instead of the attribute segment.
        const segOffset = eleMatch[0].indexOf(' ') + 1
        const attributes = Array.from(attrSeg.matchAll(attributeRE))

        // Pending position-based edits applied to matchStrTemp once we know whether utilities
        // were collected. Replaces the previous `String.replace` approach — that rewrote the
        // FIRST substring match, which could land on an unrelated attribute whose value happened
        // to equal `name` or `existsClass`
        // (e.g. `<div data-foo="text-red" className="text-red" mt-2 />`). Indices below are
        // matchStrTemp-relative.
        const edits: AttrEdit[] = []
        // Insertion point queued at a static `class`/`className` closing quote; held by
        // reference so it can be filled once `attrSelectors` is known without rescanning edits.
        let appendEdit: AttrEdit | null = null

        // Push a deletion edit for just the attribute token itself (no surrounding
        // whitespace). Adjacent deletions therefore never overlap on a shared space —
        // overlap would corrupt later edits whose indices were computed against the
        // original string. Orphan whitespace left behind is cleaned up by a single
        // collapse pass after all edits are applied.
        const pushRemoval = (attrStart: number, attrLen: number): void => {
          const absStart = segOffset + attrStart
          edits.push({ start: absStart, end: absStart + attrLen, replacement: '' })
        }

        // JSX `{...}` expression containers are tokenised by `attributeRE` into the leading
        // `name={fragment` (value bindings) or `{fragment` (spreads) plus stray sub-tokens
        // (`?`, `b`, `:`, `c` in `{a ? b : c}`). The `{` itself isn't in `attributeRE`'s char
        // class, so it's never yielded as a token — a spread's FIRST token is whatever follows
        // the `{` (e.g. `...` for `{...x}`, `a:` for `{ a: b }`), and inner identifiers that
        // happen to look like utilities (`flex`, `block`) would otherwise be consumed and
        // deleted, corrupting the runtime object (e.g. `{ a: flex }` -> `{ a: }`).
        //
        // Pre-scan `attrSeg` once and record every braced container's span. A lazy in-loop
        // watermark does NOT suffice: a spread's first stray token (`...`, or `flex` in
        // `{ a: flex }`) doesn't start with `{`, so it would never trigger the per-token
        // re-extraction that would advance a watermark — yet it must still be skipped. Spreads
        // can appear anywhere in the attribute list (`<Comp className="x" {...rest} />`), so we
        // need ALL container spans up front. A token whose START falls strictly inside a span
        // is an inner stray and is skipped; a value binding's leading `name=` token starts
        // before `{`, so it survives and reaches the per-token re-extraction below.
        const consumedRanges: Array<[number, number]> = []
        if (isJsx) {
          for (let i = 0; i < attrSeg.length; i++) {
            if (attrSeg[i] !== '{')
              continue
            const full = scanBracedExpression(attrSeg, i, attrSeg.length)
            if (full) {
              consumedRanges.push([i, i + full.length - 1])
              i += full.length - 1
            }
            // Unbalanced — leave it; the per-token re-extraction below will flag skipElement.
          }
        }
        // True if `pos` falls strictly inside any consumed container span. Half-open at the
        // start so the value-binding's leading token (which starts at the attribute name,
        // before `{`) is NOT considered consumed; the inner strays after `{` are.
        const isInsideConsumed = (pos: number): boolean => {
          for (const [s, e] of consumedRanges) {
            if (pos > s && pos <= e)
              return true
          }
          return false
        }

        let skipElement = false
        for (const attribute of attributes) {
          const matchStr = attribute[0]
          const name = attribute[1]
          const attrStart = attribute.index!

          // this token starts strictly inside a previously scanned `{...}` container — it's an
          // inner stray of a spread or value binding, not a real attribute; skip it.
          if (isInsideConsumed(attrStart))
            continue

          // skip Vue dynamic bindings (`:foo="..."`) — value is a JS expression, not utility tokens
          if (name.startsWith(':'))
            continue

          let content = attribute[2]

          // Offset of `content` within matchStr — used both to locate the start of a `{...}`
          // container for re-extraction AND to compute the attribute's end span for the dynamic
          // class rewrite. Computed unconditionally because the dynamic-class span (below) needs
          // it even when content is NOT re-extracted (e.g. whitespace-free `{c}` or
          // `className = {c}` where `=` has surrounding spaces).
          const contentOffset = content ? matchStr.indexOf(content) : -1

          // JSX value bindings `attr={expr}`: `attributeRE` captures unquoted values with `\S+`,
          // which truncates at the first whitespace inside a `{...}` container
          // (`{cond ? 'a' : 'b'}` → `{cond`). Re-extract the full `{...}` via brace balancing so
          // dynamic detection works for ternaries, object literals, template strings, and spaced
          // identifiers alike. Whitespace-free `{expr}` (e.g. `{c}`) is already captured whole by
          // `\S+`; only the truncated case needs re-extraction.
          let braceUnbalanced = false
          if (isJsx && content && content.startsWith('{') && !content.endsWith('}')) {
            const braceStart = attrStart + contentOffset
            const full = scanBracedExpression(attrSeg, braceStart, attrSeg.length)
            if (full) {
              content = full
            }
            else {
              // expression container isn't balanced in the matched slice — can't safely classify
              // or rewrite. Skip this whole element so neither the attribute nor its `m-2`
              // shorthand gets silently dropped or duplicated.
              braceUnbalanced = true
            }
          }
          if (braceUnbalanced) {
            skipElement = true
            break
          }

          // JSX dynamic bindings `attr={expr}` (except `class`/`className`, handled below to
          // preserve the runtime value) carry a JS expression that can't be statically compiled
          // to utility tokens at build time — skip. Vue's `:attr="..."` is already skipped by
          // the `:` guard above.
          const isJsxDynamicValue = isJsx && !!content && /^\{[\s\S]*\}$/.test(content)
          if (isJsxDynamicValue && !['class', 'className'].includes(name))
            continue

          const nonPrefixed = name.replace(prefix, '')
          if (!ignoreAttributes.includes(nonPrefixed)) {
            if (!content) {
              // non-valued attributes, e.g. `<div mt-2 />` -> class `mt-2`
              if (prefixedOnly && prefix && !name.startsWith(prefix))
                continue
              if (isValidSelector(nonPrefixed) && nonValuedAttribute) {
                // only keep it if UnoCSS actually recognises the token as a utility
                if (await uno.parseToken(nonPrefixed)) {
                  attrSelectors.push(nonPrefixed)
                  deleteAttributes && pushRemoval(attrStart, matchStr.length)
                }
              }
            }
            else {
              // valued attributes, e.g. `<div text="red" p="2" />`
              if (name.includes('hover-class'))
                // `hover-class` is a native applet attribute, never an attributify target
                continue
              if (['class', 'className'].includes(name)) {
                // Vue `:class` is already filtered by the `name.startsWith(':')` guard above;
                // `name` here is literally `class` or `className`, never contains `:`.
                if (isJsxDynamicValue) {
                  // JSX `className={expr}` / `class={expr}` — can't read expr at build time, but
                  // remember the attribute name and raw `{expr}` snippet so utilities can be
                  // appended via a template literal below, preserving the runtime expression.
                  // Span covers `name=` + any whitespace around `=` + the (possibly re-extracted)
                  // full `{...}` expression. Anchored on `contentOffset` rather than a hardcoded
                  // `name.length + 1`, which would undershoot when `=` has surrounding spaces
                  // (e.g. `className = {c}`) and leave the trailing expression chars outside the
                  // rewrite, producing invalid JSX.
                  dynamicClassName = name
                  dynamicClassContent = content
                  dynamicClassStart = segOffset + attrStart
                  dynamicClassEnd = dynamicClassStart + contentOffset + content.length
                }
                else {
                  // static `class="foo"` / `className="foo"` — queue a zero-width insertion
                  // point at THIS attribute's closing quote so generated utilities append inside
                  // the string, rather than to the first substring match of the value elsewhere
                  // in the tag. The replacement is filled in below once attrSelectors is known;
                  // holding the edit object by reference avoids a string sentinel, which would
                  // be ambiguous if the class value itself happened to contain it.
                  hasStaticClass = true
                  staticClassValue = content.replace(/['"`]/g, '')
                  const insertAt = segOffset + attrStart + matchStr.length - 1
                  appendEdit = { start: insertAt, end: insertAt, replacement: '' }
                  edits.push(appendEdit)
                }
              }
              else {
                if (prefixedOnly && prefix && !name.startsWith(prefix))
                  continue

                const result: string[] = []

                for (const v of content.split(splitterRE).filter(Boolean)) {
                  let token = v
                  // value shorthand: b="~ green dark:red dark:2"
                  if (v.includes(':')) {
                    // variant-prefixed value, e.g. `dark:red` on `text` -> try `dark:text-red`
                    // first, fall back to the raw token if the prefix form isn't a utility
                    const splitV = v.split(':')
                    token = `${splitV[0]}:${splitV[1]}`
                    if (await uno.parseToken(`${nonPrefixed}-${splitV[1]}`))
                      result.push(`${splitV[0]}:${nonPrefixed}-${splitV[1]}`)
                    else if (await uno.parseToken(`${splitV[0]}:${splitV[1]}`))
                      result.push(`${splitV[0]}:${splitV[1]}`)
                  }
                  else {
                    // `~` references the attribute name itself (self shorthand);
                    // leading `!` is UnoCSS important modifier, kept in front of the composed token
                    if (v === '~')
                      token = nonPrefixed
                    else if (v.startsWith('!'))
                      token = `!${nonPrefixed}-${v.slice(1)}`
                    else
                      token = `${nonPrefixed}-${v}`
                    if (await uno.parseToken(token))
                      result.push(token)
                  }
                }

                attrSelectors.push(...result)
                result.length && deleteAttributes && pushRemoval(attrStart, matchStr.length)
              }
            }
          }
        }

        if (skipElement)
          continue

        if (attrSelectors.length) {
          if (hasStaticClass && appendEdit) {
            // fill in the queued insertion point at the static class attribute's closing quote.
            // Skip the leading separator when the existing value is empty, so `class=""` plus
            // utilities yields `class="m-2"`, not `class=" m-2"`.
            const sep = staticClassValue ? ' ' : ''
            appendEdit.replacement = `${sep}${attrSelectors.join(' ')}`
          }
          else if (dynamicClassContent) {
            // JSX `className={expr}` / `class={expr}` — wrap expr in a template literal so
            // generated utilities are appended at runtime without losing the original value.
            // e.g. `className={c}` + `m-2` -> `className={`${c} m-2`}`.
            // Anchored to the span captured in the attribute loop, NOT an `indexOf` of the
            // assembled target — that would rewrite the first substring match and could corrupt
            // a sibling attribute whose value happens to equal `className={...}`.
            const expr = dynamicClassContent.slice(1, -1)
            const utilities = attrSelectors.join(' ')
            // Assemble `name={`${expr} utilities`}` via plain concatenation, not `String.replace`,
            // so `expr` containing `$&`, `$1`, `$<name>`, or `$$` is copied literally rather than
            // interpreted as a replacement pattern.
            const replacement = `${dynamicClassName}={\`\${${expr}} ${utilities}\`}`
            edits.push({ start: dynamicClassStart, end: dynamicClassEnd, replacement })
          }

          // Apply queued position-based edits in a single right-to-left sweep so earlier
          // indices stay valid as later spans are rewritten. Spans are half-open: [start, end);
          // token-only deletions never overlap, so non-overlap holds even with a leading-space
          // insertion at the static class attribute's closing quote.
          edits.sort((a, b) => b.start - a.start)
          for (const { start: eStart, end: eEnd, replacement: eRep } of edits)
            matchStrTemp = `${matchStrTemp.slice(0, eStart)}${eRep}${matchStrTemp.slice(eEnd)}`

          // Attribute deletions leave behind the whitespace that used to separate them, so
          // consecutive deletions produce runs of `  ` in the tag header, and a trailing space
          // before the closing `>`/`/>`. Collapse runs to a single space and drop the trailing
          // run entirely — but only OUTSIDE quoted attribute values AND JSX `{...}` expression
          // containers, both of which may legitimately contain multiple spaces (or any other
          // whitespace-sensitive content) and must be copied byte-for-byte. Covering braced
          // expressions verbatim also protects nested template literals inside them
          // (e.g. the `className={`${expr} m-2`}` this transformer emits), whose own backtick
          // strings can't be reliably tracked here because `${...}` interpolation may itself
          // contain unbalanced quotes. Walks char-by-char tracking quote + brace state;
          // O(tag length), tags are short.
          let collapsed = ''
          let runStart = -1
          const flushRun = (): void => {
            if (runStart !== -1) {
              collapsed += ' '
              runStart = -1
            }
          }
          for (let i = 0; i < matchStrTemp.length; i++) {
            const ch = matchStrTemp[i]!
            if (ch === '\'' || ch === '"') {
              flushRun()
              const close = matchStrTemp.indexOf(ch, i + 1)
              collapsed += matchStrTemp.slice(i, close === -1 ? matchStrTemp.length : close + 1)
              i = close === -1 ? matchStrTemp.length - 1 : close
              continue
            }
            if (ch === '{') {
              // copy a balanced `{...}` expression verbatim, skipping over any quoted runs
              // inside it so `}` within a string doesn't collapse the depth. Brace detection
              // here is best-effort: a `}` inside a `${...}` interpolation isn't modeled, but
              // that pattern is rare in className expressions and the worst case is leaving
              // the expression untouched (a missing collapse), never corrupting its content.
              flushRun()
              const close = scanBracedExpression(matchStrTemp, i, matchStrTemp.length)
              if (close) {
                collapsed += close
                i += close.length - 1
                continue
              }
              // unbalanced — fall through to per-char handling rather than risk truncation
            }
            if (/\s/.test(ch)) {
              if (runStart === -1)
                runStart = i
            }
            else {
              flushRun()
              collapsed += ch
            }
          }
          // Intentionally do NOT flush a trailing run here — that drops the orphan space
          // before the closing `>`/`/>` left by an attribute deletion.
          matchStrTemp = collapsed
          // Strip a stray space between the last attribute and a non-self-closing `>`
          // (e.g. `<div class="x" >` -> `<div class="x">`). Self-closing `/>` keeps its
          // space — `<div />` is idiomatic in both Vue and JSX.
          matchStrTemp = matchStrTemp.replace(/(["'}])\s+(>)$/, '$1$2')

          // Inject a class attribute when none existed. Done after the edits + collapse above
          // so the insert position is computed against the current matchStrTemp, not the
          // original — otherwise deletions that reached the closing `>` would shift the insert
          // point into the middle of the surviving text. The collapse pass already trimmed the
          // trailing space before `>`/`/>`, so the injected attribute needs a leading space of
          // its own to separate it from the last surviving attribute (or the tag name).
          if (!hasStaticClass && !dynamicClassContent) {
            const classAttr = isJsx ? 'className' : 'class'
            const selfClosing = matchStrTemp.endsWith('/>')
            const insertPos = matchStrTemp.length - (selfClosing ? 2 : 1)
            // Skip the leading space if a separator already precedes the insert point — the
            // collapse pass keeps a single space between the tag name (or last surviving
            // attribute) and the closing `>`, so injecting another would produce `<div  class=`.
            const sep = matchStrTemp[insertPos - 1] === ' ' ? '' : ' '
            matchStrTemp = `${matchStrTemp.slice(0, insertPos)}${sep}${classAttr}="${attrSelectors.join(' ')}"${matchStrTemp.slice(insertPos)}`
          }

          code.overwrite(start, start + eleMatch[0].length, matchStrTemp)
        }
      }

      s.overwrite(0, s.original.length, code.toString())
    },
  }
}

export default transformerAttributify
