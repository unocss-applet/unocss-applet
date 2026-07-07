import type { SourceCodeTransformer } from '@unocss/core'
import type { TransformerHoverOptions } from './types'
import MagicString from 'magic-string'

export * from './types'

/**
 * Move `hover:xxx` utilities into the mini-program-native `hover-class` attribute.
 *
 * Mini-programs don't support the `:hover` pseudo-class in wxss — `hover:xxx` utilities
 * emitted by UnoCSS are silently dropped at runtime. Native `view`/`button` components
 * instead take a string `hover-class` attribute applied while pressed. This transformer
 * rewrites `hover:` utilities out of the static `class` / `className` attribute and into
 * `hover-class` (stripping the `hover:` prefix, since the attribute already implies the
 * pressed state), so the utilities actually take effect on the applet side.
 *
 * `hover-class` is string-only (official Weixin/Alipay docs), so the output is always a
 * single space-joined string — never an array. An empty result is never emitted:
 * `hover-class=""` is harmless, but `hover-class="none"` is a sentinel that disables the
 * hover effect, and emitting an empty value risks colliding with a framework default.
 *
 * Scope: `.vue` (uni-app / Taro-vue) and `.jsx`/`.tsx` (Taro React). Same regex-based
 * gotchas and mitigations as `transformer-attributify` — see its block comment for the
 * full list (JSX `>` inside expression containers, fragments, comments). In particular a
 * `>` inside any JSX expression container is treated as the tag's closing `>`, so the
 * element is matched only up to that `>` and silently skipped.
 *
 * Eligibility (what gets moved): a token is moved only if, after stripping an optional
 * leading `!` important modifier and the `hover:` prefix, the remaining body (a) is a real
 * UnoCSS utility AND (b) carries no further variant qualifier — detected via a top-level `:`
 * outside any `[...]` arbitrary-value group. So `hover:bg-red`, `!hover:bg-red`,
 * `hover:bg-[url(http://x)]`, `hover:bg-red/50` all move; `hover:dark:bg-red`,
 * `hover:focus:bg-red`, `hover:peer-focus:bg-red`, `dark:hover:bg-red` do not (hover-class
 * can't gate on dark/focus/media/peer). A leading `!` is re-applied to the moved body.
 *
 * Out of scope:
 * - Variant-qualified `hover:` (any side): `dark:hover:`, `md:hover:`, `hover:dark:`,
 *   `hover:focus:`, `hover:peer-focus:` — left in `class` (see eligibility above).
 * - `hover:` tokens inside dynamic `:class="[cond ? 'hover:a' : 'hover:b']"` /
 *   `className={[...]}` expressions: a regex can't reliably parse JS expressions to extract
 *   the literals. Write `hover-class` manually in that case.
 * - Non-utility `hover:` tokens (body not recognised by UnoCSS): left in `class`.
 */
const splitterRE = /[\s'"`;]+/g

// Contract: capture group 1 MUST be the full attribute segment, spanning from the first
// attribute after the tag name through the last attribute before the closing `/?>`. The
// attribute-loop below maps regex indices from attrSeg-space into match-space via
// `segOffset` — depends on this invariant.
// eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/no-dupe-disjunctions
const elementRE = /<\w(?=.*>)[\w:.$-]*\s(((".*?>?.*?")|.*?)*?)\/?>/gs
// Captures unquoted JSX values with `\S+`, which truncates at the first whitespace inside a
// `{...}` expression container (`{a ? b : c}` → `{a`). JSX attribute handling re-extracts
// the full container via `scanBracedExpression` below.
// eslint-disable-next-line regexp/no-super-linear-backtracking
const attributeRE = /([[?\w\u00A0-\uFFFF-:()#%.\]]+)(?:\s*=\s*('[^']*'|"[^"]*"|\S+))?/g

/**
 * Skip a quoted run (`'...'`, `"..."`, or template `` `...` ``) inside an attribute value,
 * returning the index just past the closing quote. Used by `scanBracedExpression` so braces
 * inside string/template literals don't throw off the depth counter.
 */
function skipQuoted(seg: string, quoteStart: number, end: number): number | null {
  const quote = seg[quoteStart]
  for (let i = quoteStart + 1; i < end; i++) {
    if (seg[i] === '\\') {
      i++
      continue
    }
    if (seg[i] === quote)
      return i + 1
  }
  return null
}

/**
 * Scan a balanced `{...}` expression in `seg[braceStart..end)`. Returns the slice `{...}`
 * including both braces, or `null` if unbalanced. Mirrors `transformer-attributify`'s helper
 * so JSX ternaries / object literals / template strings in attribute values are read whole
 * rather than truncated at the first whitespace by `attributeRE`.
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
      i = after - 1
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

/**
 * True if `body` contains a top-level `:` variant separator (a `:` NOT inside an arbitrary-
 * value `[...]` group). Pure utility bodies (`bg-red`, `bg-[url(http://x)]`,
 * `content-['a:b']`, `w-[calc(100%-1px)]`, `bg-red/50`) have no top-level `:`; any variant
 * form (`dark:`, `focus:`, `active:`, `peer-focus:`, `md:`, `hover:` itself, …) does, and
 * those can't be expressed by `hover-class` (no way to gate on focus/dark/media/peer), so
 * they must be left in `class`.
 *
 * This is more robust than inspecting the parsed selector's shape: pseudo-class variants
 * (`focus:`, `active:`) compile to a single compound selector with no whitespace / no
 * `@media` parent, so a selector-shape check would wrongly classify them as pure. A top-level
 * colon in the body is the defining feature of a variant form.
 */
function hasVariantSeparator(body: string): boolean {
  let depth = 0
  for (const ch of body) {
    if (ch === '[')
      depth++
    else if (ch === ']')
      depth = Math.max(0, depth - 1)
    else if (ch === ':' && depth === 0)
      return true
  }
  return false
}

export function transformerHover(options: TransformerHoverOptions = {}): SourceCodeTransformer {
  return {
    name: 'transformer-hover',
    enforce: 'pre',
    async transform(s, id, { uno }) {
      if (!/\.(?:vue|[jt]sx)$/.test(id))
        return

      const isJsx = /\.(?:j|t)sx$/.test(id)
      const classAttrName = options.classAttributeName ?? (isJsx ? 'className' : 'class')
      // Vue uses kebab-case `hover-class`; JSX uses camelCase `hoverClass`. The dynamic
      // binding forms are `:hover-class` (Vue) and `hoverClass={expr}` (JSX).
      const hoverAttrName = options.hoverAttributeName ?? (isJsx ? 'hoverClass' : 'hover-class')

      const code = new MagicString(s.toString())

      let changed = false
      const elementMatches = code.original.matchAll(elementRE)
      for (const eleMatch of elementMatches) {
        const start = eleMatch.index!
        let matchStrTemp = eleMatch[0]
        const attrSeg = eleMatch[1] || ''
        // attrSeg offset within the full tag match: the element regex is `<\w[\w:.$-]*\s(...)`,
        // so the first whitespace separates the tag name from attributes and attrSeg begins
        // right after it. Use `search(/\s/)` rather than `indexOf(' ')` so a tab or newline
        // between the tag name and the first attribute is handled — `indexOf(' ')` would
        // return -1 there and shift every downstream index into the tag name, corrupting it.
        const segOffset = eleMatch[0].search(/\s/) + 1
        const attributes = Array.from(attrSeg.matchAll(attributeRE))

        // Hover tokens collected from THIS element's class attribute(s), to be moved into
        // hover-class.
        const hoverTokens: string[] = []
        // Per-static-class-attribute edit descriptor. An element may legally have multiple
        // `class` attributes in malformed-but-tolerated markup, and each must be rewritten
        // independently — a single (start,end,value) triple would only remember the LAST one
        // and leave earlier `class` attributes with their `hover:` tokens duplicated in both
        // the (untouched) literal and the new `hover-class`.
        interface ClassSlotEdit { valueStart: number, valueEnd: number, kept: string }
        const classSlotEdits: ClassSlotEdit[] = []
        // Pending position-based edits, applied right-to-left so earlier indices stay valid.
        const edits: AttrEdit[] = []
        // Existing hover-class slot state: detected during the attribute walk so we can merge
        // into it rather than injecting a duplicate attribute.
        let hoverAttrValue = '' // static literal value, if present
        let hoverAttrStart = -1 // span of the static hover-class VALUE (between quotes)
        let hoverAttrEnd = -1
        // Dynamic hover-class (`:hover-class="expr"` / `hoverClass={expr}`): wrap expr in a
        // template literal so collected tokens append at runtime without losing the original.
        let hoverDynContent = '' // raw `{expr}` or `"expr"` snippet
        let hoverDynStart = -1 // absolute span in matchStrTemp
        let hoverDynEnd = -1
        // Value-less shorthand (`<div hover-class/>`): span of the bare attribute token, so it
        // can be rewritten to a valued form rather than leaving a duplicate attribute behind.
        let hoverShorthandStart = -1
        let hoverShorthandEnd = -1

        // Pre-scan braced `{...}` containers so stray sub-tokens inside them (from spreads or
        // value bindings tokenised by `attributeRE`) are not misread as standalone attributes.
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
          }
        }
        const isInsideConsumed = (pos: number): boolean => {
          for (const [cs, ce] of consumedRanges) {
            if (pos > cs && pos <= ce)
              return true
          }
          return false
        }

        let skipElement = false
        for (const attribute of attributes) {
          const matchStr = attribute[0]
          const name = attribute[1]
          const attrStart = attribute.index!

          if (isInsideConsumed(attrStart))
            continue

          let content = attribute[2]
          const contentOffset = content ? matchStr.indexOf(content) : -1

          // JSX value bindings `attr={expr}`: re-extract the full `{...}` if `attributeRE`
          // truncated it at the first whitespace inside the braces.
          let braceUnbalanced = false
          if (isJsx && content && content.startsWith('{') && !content.endsWith('}')) {
            const braceStart = attrStart + contentOffset
            const full = scanBracedExpression(attrSeg, braceStart, attrSeg.length)
            if (full)
              content = full
            else
              braceUnbalanced = true
          }
          if (braceUnbalanced) {
            skipElement = true
            break
          }

          const isJsxDynamicValue = isJsx && !!content && /^\{[\s\S]*\}$/.test(content)

          // --- class / className slot ---
          // Vue dynamic `:class` / JSX dynamic `className={expr}`: a regex can't reliably
          // extract `hover:` literals from a JS expression, so dynamic class bindings are
          // left untouched. Only the STATIC literal is harvested.
          const isStaticClass = name === classAttrName && !isJsxDynamicValue && !!content
            && !content.startsWith('{')
          if (isStaticClass) {
            const rawValue = content.replace(/['"`]/g, '')
            const tokens = rawValue.split(splitterRE).filter(Boolean)
            const kept: string[] = []
            let movedAny = false
            for (const tok of tokens) {
              // Strip a leading `!` important modifier so both `hover:bg-red` and
              // `!hover:bg-red` are eligible (UnoCSS treats them as the same rule, applied
              // with `!important`). The `!` is re-applied to the body when moved.
              const important = tok.startsWith('!')
              const stripped = important ? tok.slice(1) : tok
              // Only standalone `hover:` (no preceding variant) is eligible; a token like
              // `dark:hover:bg-red` starts with `dark:`, not `hover:`, so it's correctly left
              // in place — hover-class can't express a variant qualifier.
              if (stripped.startsWith('hover:')) {
                const body = stripped.slice('hover:'.length)
                const moved = important ? `!${body}` : body
                // Validate the REASSEMBLED token (not just the body) so a doubly-important
                // input like `!hover:!bg-red` doesn't get re-emitted as the invalid `!!bg-red`.
                // And reject any body carrying a variant qualifier (`hover:focus:`,
                // `hover:dark:`) via `hasVariantSeparator`'s top-level-colon check.
                if (!hasVariantSeparator(body) && (await uno.parseToken(moved))?.[0]) {
                  hoverTokens.push(moved)
                  movedAny = true
                  continue
                }
              }
              kept.push(tok)
            }
            if (movedAny) {
              // Record THIS class attribute's value span for rewriting below. Each static
              // class attribute gets its own edit so multiple `class` attrs are all stripped.
              // Span is the inner content between the quotes (contentOffset..+content.length
              // covers the quoted value including quotes; +1/-1 trims to the inner value).
              const valueStart = segOffset + attrStart + contentOffset + 1
              classSlotEdits.push({
                valueStart,
                valueEnd: valueStart + content.length - 2,
                kept: kept.join(' '),
              })
            }
            continue
          }

          // --- hover-class slot detection ---
          // Match the hover attribute in any of its forms: static `hover-class` /
          // `hoverClass`, dynamic Vue `:hover-class`, or dynamic JSX `hoverClass={expr}`.
          const isHoverAttr = name === hoverAttrName
            || (!isJsx && name === `:${hoverAttrName}`)
          if (!isHoverAttr)
            continue

          if (isJsxDynamicValue || (!isJsx && name.startsWith(':'))) {
            // Dynamic hover-class. Wrap expr in a template literal later. Span covers the
            // quoted value (Vue `:hover-class="expr"`) or the braced expression (JSX
            // `hoverClass={expr}`); for Vue we strip the surrounding quotes when wrapping.
            hoverDynContent = content
            hoverDynStart = segOffset + attrStart + contentOffset
            hoverDynEnd = hoverDynStart + content.length
          }
          else if (content) {
            // Static hover-class literal — read its tokens so they merge with collected ones.
            hoverAttrValue = content.replace(/['"`]/g, '')
            hoverAttrStart = segOffset + attrStart + contentOffset + 1
            hoverAttrEnd = hoverAttrStart + content.length - 2
          }
          else {
            // Value-less shorthand (`<div hover-class/>`). No value span to overwrite, but
            // the attribute is present — record its span so we rewrite it to a valued form
            // below instead of injecting a duplicate `hover-class="..."`.
            hoverShorthandStart = segOffset + attrStart
            hoverShorthandEnd = hoverShorthandStart + matchStr.length
          }
        }

        if (skipElement)
          continue

        if (!hoverTokens.length)
          continue

        // Merge any pre-existing static hover-class tokens first, preserving their order
        // relative to the newly collected ones (issue example 2: `text-xl bg-red`).
        const merged = hoverAttrValue
          ? [...hoverAttrValue.split(splitterRE).filter(Boolean), ...hoverTokens]
          : hoverTokens

        if (hoverAttrStart !== -1) {
          // Overwrite the existing static hover-class value.
          edits.push({
            start: hoverAttrStart,
            end: hoverAttrEnd,
            replacement: merged.join(' '),
          })
        }
        else if (hoverDynContent) {
          // Wrap the dynamic hover-class expression in a template literal that appends the
          // collected tokens at runtime via `${...}` interpolation:
          //   Vue :hover-class="expr"  -> :hover-class="`${expr} tokens`"
          //   JSX hoverClass={expr}    -> hoverClass={`${expr} tokens`}
          // The original expression is preserved verbatim inside `${}` so its runtime value
          // isn't lost; collected tokens are appended as a static suffix.
          // Vue content is the quoted `"expr"`; JSX content is the braced `{expr}`. Both
          // slice(1, -1) yields the inner expression.
          const expr = hoverDynContent.slice(1, -1)
          const template = `\`\${${expr}} ${merged.join(' ')}\``
          // Preserve the Vue binding's original quote char so an expression containing `"`
          // (wrapped in `'...\'`) doesn't collide with the wrapper — hardcoding `"` would
          // terminate the attribute value early and corrupt the markup.
          const vueQuote = hoverDynContent[0] === '\'' ? '\'' : '"'
          edits.push({
            start: hoverDynStart,
            end: hoverDynEnd,
            // Vue `:hover-class="expr"` -> `:hover-class="`${expr} tokens`"` (quoted).
            // JSX `hoverClass={expr}` -> `hoverClass={`${expr} tokens`}` (braced).
            replacement: isJsx ? `{${template}}` : `${vueQuote}${template}${vueQuote}`,
          })
        }
        else if (hoverShorthandStart !== -1) {
          // Rewrite the value-less shorthand `hover-class` to a valued `hover-class="..."`.
          edits.push({
            start: hoverShorthandStart,
            end: hoverShorthandEnd,
            replacement: `${hoverAttrName}="${merged.join(' ')}"`,
          })
        }
        // The "no existing hover-class attribute" case is handled by the injection below
        // (after the collapse pass), since the insert position must be computed against the
        // collapsed text rather than the original.

        // Rewrite each static class attribute (tokens removed). If a class becomes empty,
        // drop the whole attribute by expanding the edit to cover `class="..."`. Each slot
        // is handled independently so multiple `class` attributes are all stripped.
        for (const { valueStart, valueEnd, kept } of classSlotEdits) {
          if (kept) {
            edits.push({ start: valueStart, end: valueEnd, replacement: kept })
          }
          else {
            // Expand to swallow the entire `name="value"` attribute. valueStart points at the
            // first char inside the opening quote; back up to the attribute name and forward
            // past the closing quote.
            // Attribute layout in matchStrTemp: ...<sp>name<sp?>=<sp?>"value"<sp?>...
            let i = valueStart - 1 // opening quote
            i-- // now at `=` or a space
            while (i >= 0 && /[\s=]/.test(matchStrTemp[i]!))
              i--
            // i now at the last char of the attribute name; walk back to its start.
            while (i >= 0 && /[\w$:.-]/.test(matchStrTemp[i]!))
              i--
            const attrNameStart = i + 1
            edits.push({
              start: attrNameStart,
              end: valueEnd + 1,
              replacement: '',
            })
          }
        }

        // Apply edits right-to-left so earlier indices stay valid.
        edits.sort((a, b) => b.start - a.start)
        for (const { start: eStart, end: eEnd, replacement: eRep } of edits)
          matchStrTemp = `${matchStrTemp.slice(0, eStart)}${eRep}${matchStrTemp.slice(eEnd)}`

        // Collapse orphan whitespace left by attribute deletions (quote + brace aware), same
        // approach as `transformer-attributify`.
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
            flushRun()
            const close = scanBracedExpression(matchStrTemp, i, matchStrTemp.length)
            if (close) {
              collapsed += close
              i += close.length - 1
              continue
            }
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
        matchStrTemp = collapsed
        // Strip a stray space between the last attribute and a bare closing `>`, but KEEP one
        // before self-closing `/>` (`<div />` is idiomatic in both Vue and JSX). Matches the
        // sibling `transformer-attributify`'s collapse pass verbatim — kept identical so the
        // two transformers emit the same whitespace shape on the same input.
        matchStrTemp = matchStrTemp.replace(/(["'}])\s+(>)$/, '$1$2')

        // Inject hover-class attribute if none existed (no static value, no dynamic binding,
        // no shorthand) and we have tokens to write. Done after the collapse pass so the
        // insert position is computed against current text.
        if (hoverAttrStart === -1 && !hoverDynContent && hoverShorthandStart === -1 && hoverTokens.length) {
          const selfClosing = matchStrTemp.endsWith('/>')
          const insertPos = matchStrTemp.length - (selfClosing ? 2 : 1)
          const sep = matchStrTemp[insertPos - 1] === ' ' ? '' : ' '
          matchStrTemp = `${matchStrTemp.slice(0, insertPos)}${sep}${hoverAttrName}="${hoverTokens.join(' ')}"${matchStrTemp.slice(insertPos)}`
        }

        code.overwrite(start, start + eleMatch[0].length, matchStrTemp)
        changed = true
      }

      // Only overwrite the source when something actually changed. On an empty file (or one
      // with no eligible elements) `s.overwrite(0, 0, ...)` / `(0, len, same)` would throw or
      // be a wasted no-op; MagicString rejects zero-length overwrites.
      if (changed)
        s.overwrite(0, s.original.length, code.toString())
    },
  }
}

export default transformerHover
