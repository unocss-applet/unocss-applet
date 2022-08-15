import type { SourceCodeTransformer, UnocssPluginContext } from '@unocss/core'

export interface RenameClassOptions {
  /**
   * Prefix for compile class name
   * @default 'uno-'
   */
  classPrefix?: string

  /**
   * Hash function
   */
  hashFn?: (str: string) => string

  /**
   * The layer name of generated rules
   */
  layer?: string
}

export default function transformerRenameClass(options: RenameClassOptions = {}): SourceCodeTransformer {
  const {
    classPrefix = 'uno-',
    hashFn = hash,
    layer = 'applet_shortcuts',
  } = options

  // Regular expression of characters to be escaped
  const charReg = /[.:%!#()[\/\],]/

  const classRE = /:?(hover-)?class=\".*?\"/g
  const stringRE = /(['\`]).*?(['\`])/g

  async function compileApplet(body: string, ctx: UnocssPluginContext): Promise<string[]> {
    const { uno, tokens } = ctx
    const replacements = []
    const result = await Promise.all(body.split(/\s+/).filter(Boolean).map(async i => [i, !!await uno.parseToken(i)] as const))
    const known = result.filter(([, matched]) => matched).map(([i]) => i)
    const unknown = result.filter(([, matched]) => !matched).map(([i]) => i)
    replacements.push(...unknown)
    body = known.join(' ')
    if (body) {
      const hash = hashFn(body)
      const className = `${classPrefix}${hash}`
      replacements.unshift(className)
      uno.config.shortcuts.push([className, body, { layer }])
      tokens.add(className)
    }
    return replacements
  }

  return {
    name: 'rename-class',
    enforce: 'pre',
    async transform(s, _, ctx) {
      const classMatches = [...s.original.matchAll(classRE)]
      for (const match of classMatches) {
        if (/\?.*:/g.test(match[0]))
          continue
        const start = match.index!
        const matchSplit = match[0].split('=')

        const body = matchSplit[1].slice(1, -1)

        if (charReg.test(body)) {
          const replacements = await compileApplet(body, ctx)
          s.overwrite(start, start + match[0].length, `${matchSplit[0]}="${replacements.join(' ')}"`)
        }
      }
      const stringMatches = [...s.original.matchAll(stringRE)]
      for (const match of stringMatches) {
        const start = match.index!
        const body = match[0].slice(1, -1)
        if (charReg.test(body)) {
          const replacements = await compileApplet(body, ctx)
          s.overwrite(start, start + match[0].length, `'${replacements.join(' ')}'`)
        }
      }
    },
  }
}

function hash(str: string) {
  let i; let l
  let hval = 0x811C9DC5

  for (i = 0, l = str.length; i < l; i++) {
    hval ^= str.charCodeAt(i)
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24)
  }
  return (`00000${(hval >>> 0).toString(36)}`).slice(-6)
}
