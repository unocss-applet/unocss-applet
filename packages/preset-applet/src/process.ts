const UNSUPPORTED_CHARS = ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$']
const ESCAPED_ESCAPED_UNSUPPORTED_CHARS = UNSUPPORTED_CHARS.map(char => `\\\\\\${char}`)
const charTestReg = new RegExp(`${ESCAPED_ESCAPED_UNSUPPORTED_CHARS.join('|')}`)
const charReplaceReg = new RegExp(`${ESCAPED_ESCAPED_UNSUPPORTED_CHARS.join('|')}`, 'g')

export function unoCSSToAppletProcess(str: string) {
  if (charTestReg.test(str))
    str = str.replace(charReplaceReg, '_a_')
  return str
}
