/**
 * Characters disallowed in applet (mini-program) class names.
 *
 * Applet wxss rejects these in selectors because it has no support for the corresponding
 * selector syntax — `.`/`#` (class/id), `:`/`[]`/`()` (pseudo/attribute/functional),
 * `*` (universal), `/`, `%`, operators, etc. They get rewritten to `_a_` by the preset's
 * postprocess / transformer so generated and source utilities stay referenceable.
 * `=` is included to let the transformer distinguish attributify tokens (`foo=bar`).
 */
export const UNSUPPORTED_CHARS = [
  '.',
  ':',
  '%',
  '!',
  '#',
  '(',
  ')',
  '[',
  '/',
  ']',
  ',',
  '$',
  '{',
  '}',
  '@',
  '+',
  '^',
  '&',
  '<',
  '>',
  '\'',
  '\\',
  '"',
  '?',
  '*',
  '=',
]
