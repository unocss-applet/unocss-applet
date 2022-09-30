import type { UnocssPluginContext } from 'unocss'
import type { TransformerAppletOptions } from './types'

export async function compileApplet(body: string, ctx: UnocssPluginContext, options: TransformerAppletOptions = {}): Promise<string[]> {
  const {
    classPrefix = 'uno-',
    hashFn = hash,
    layer = 'applet_shortcuts',
  } = options

  const { uno, tokens } = ctx
  const replacements = []
  // token contain ${} should set false
  const result = await Promise.all(body.split(/\s+/).filter(Boolean)
    .map(async i => [i, i.includes('${') ? false : !!await uno.parseToken(i)] as const))
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

export function hash(str: string) {
  let i; let l
  let hval = 0x811C9DC5

  for (i = 0, l = str.length; i < l; i++) {
    hval ^= str.charCodeAt(i)
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24)
  }
  return (`00000${(hval >>> 0).toString(36)}`).slice(-6)
}
