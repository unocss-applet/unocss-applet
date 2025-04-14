/**
 * Encode non-space Latin characters
 * @param str - The string to encode
 * @example
 * ```ts
 * encodeNonSpaceLatin('你好') // '203202'
 * ```
 * @returns The encoded string
 */
export function encodeNonSpaceLatin(str: string) {
  // eslint-disable-next-line regexp/prefer-w, regexp/no-obscure-range
  const regex = /[^A-Z0-9!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~\\ ]+/gi

  if (!regex.test(str))
    return str

  // for unocss shortcuts, e.g. 'a-bg': 'bg-gray-100 dark:bg-black'
  // will generate classes like '.a-bg' and '.dark $$ .a-bg'
  // so we need skip the ' $$ ' in the encoded string
  if (str.includes(' $$ '))
    return str

  function encode(str: string) {
    let encoded = ''
    for (let i = 0; i < str.length; i++)
      encoded += str.charCodeAt(i)

    return encoded
  }

  return str.replace(regex, match => encode(match))
}
