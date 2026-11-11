// 固定名称便于检查构建产物，同时避免 `/` 和 `.` 等不同符号共用别名。
const appletCharNames: Record<string, string> = {
  '.': 'dot',
  ':': 'colon',
  '%': 'percent',
  '!': 'exclamation',
  '#': 'hash',
  '(': 'lparen',
  ')': 'rparen',
  '[': 'lbracket',
  ']': 'rbracket',
  '/': 'slash',
  ',': 'comma',
  '$': 'dollar',
  '{': 'lbrace',
  '}': 'rbrace',
  '@': 'at',
  '+': 'plus',
  '^': 'caret',
  '&': 'ampersand',
  '<': 'lt',
  '>': 'gt',
  '\'': 'apostrophe',
  '\\': 'backslash',
  '"': 'quote',
  '?': 'question',
  '*': 'asterisk',
  '=': 'equals',
  '~': 'tilde',
  '`': 'backtick',
  '|': 'pipe',
  ';': 'semicolon',
}

/** 自定义字符没有固定名称时，将字符码的十六进制数位映射为 a–p，仍只使用英文字母。 */
export function encodeAppletChar(char: string): string {
  const name = Object.hasOwn(appletCharNames, char)
    ? appletCharNames[char]
    : `unicode${Array.from(char, c => c.codePointAt(0)!.toString(16).replace(/[\da-f]/g, digit => String.fromCharCode(97 + Number.parseInt(digit, 16)))).join('z')}`
  return `_${name}_`
}

/**
 * 把非空格的非 ASCII 字符编码成字符码
 * @param str - 要编码的字符串
 * @example
 * ```ts
 * encodeNonSpaceLatin('你好') // '203202'
 * ```
 * @returns 编码后的字符串
 */
export function encodeNonSpaceLatin(str: string): string {
  // eslint-disable-next-line regexp/prefer-w, regexp/no-obscure-range
  const regex = /[^A-Z0-9!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~\\ ]+/gi

  if (!regex.test(str))
    return str

  // unocss 的 shortcut 会生成形如 '.a-bg' 和 '.dark $$ .a-bg' 的类名
  // （比如 'a-bg': 'bg-gray-100 dark:bg-black'），
  // 所以编码时要跳过 ' $$ '，不能把它也转成字符码
  if (str.includes(' $$ '))
    return str

  function encode(str: string): string {
    let encoded = ''
    for (let i = 0; i < str.length; i++)
      encoded += str.charCodeAt(i)

    return encoded
  }

  return str.replace(regex, match => encode(match))
}
