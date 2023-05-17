// 编码非Latin字符
// 例如：'你好' => '203202'
export function encodeNonLatin(str: string) {
  const regex = /[^A-Za-z0-9!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~\\]+/g

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
