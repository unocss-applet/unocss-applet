import type { SourceCodeTransformer, UnocssPluginContext } from 'unocss'
import { expandVariantGroup } from '@unocss/core'

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
   * @default 'applet_shortcuts'
   */
  layer?: string

  /**
   * Enable rename class, only build applet should be true
   * e.g. In uniapp `enableRename: !(process.env.UNI_PLATFORM === 'h5')` to disable rename class in h5
   * @default true
   */
  enableRename?: boolean

  /**
   * Separators to expand.
   *
   * ```
   * foo-(bar baz) -> foo-bar foo-baz
   *    ^
   *    separator
   * ```
   *
   * You may set it to `[':']` for strictness.
   *
   * @default [':', '-']
   * @see https://github.com/unocss/unocss/pull/1231
   */
  separators?: (':' | '-')[]
}

export default function transformerRenameClass(options: RenameClassOptions = {}): SourceCodeTransformer {
  const {
    classPrefix = 'uno-',
    hashFn = hash,
    layer = 'applet_shortcuts',
    enableRename = true,
  } = options

  // Regular expression of characters to be escaped
  const charReg = /[.:%!#()[\/\],]/

  const classRE = /:?(hover-)?class=\".*?\"/g
  const stringRE = /(['\`]).*?(['\`])/g

  return {
    name: 'rename-class',
    enforce: 'pre',
    async transform(s, _, ctx) {
      if (!enableRename) {
        // https://github.com/unocss/unocss/tree/main/packages/transformer-variant-group
        expandVariantGroup(s, options.separators)
      }
      else {
        // process class
        const classMatches = [...s.original.matchAll(classRE)]
        for (const match of classMatches) {
          // skip `... ? ... : ...`
          if (/\?.*:/g.test(match[0]))
            continue

          // skip `... : ...`
          if (/{.+:.+}/g.test(match[0]))
            continue

          const start = match.index!
          const matchSplit = match[0].split('class=')

          const body = expandVariantGroup(matchSplit[1].slice(1, -1), options.separators)

          if (charReg.test(body)) {
            const replacements = await compileApplet(body, ctx)
            s.overwrite(start, start + match[0].length, `${matchSplit[0]}class="${replacements.join(' ')}"`)
          }
        }

        // process string
        const stringMatches = [...s.original.matchAll(stringRE)]
        for (const match of stringMatches) {
          // skip `${...}`
          if (/\$\{.*\}/g.test(match[0]))
            continue

          // There may be no need
          // https://tailwindcss.com/docs/background-image#arbitrary-values
          // skip all the image formats in HTML for bg-[url('...')]
          if (/\.(png|jpg|jpeg|gif|svg)/g.test(match[0]))
            continue
          // skip http(s)://
          if (/http(s)?:\/\//g.test(match[0]))
            continue

          const start = match.index!
          const body = match[0].slice(1, -1)
          if (charReg.test(body)) {
            const replacements = await compileApplet(body, ctx)
            s.overwrite(start, start + match[0].length, `'${replacements.join(' ')}'`)
          }
        }
      }
    },
  }

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
