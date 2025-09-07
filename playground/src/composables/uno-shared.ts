import type { UserConfig } from '@unocss/core'
import { escapeRegExp, isAttributifySelector, splitWithVariantGroupRE } from '@unocss/core'
import { $fetch } from 'ofetch'
import * as __unocss from 'unocss'

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor

const CDN_BASE = 'https://esm.sh/'
const modulesCache = new Map<string, Promise<unknown> | unknown>()
modulesCache.set('unocss', __unocss)

export function clearModuleCache() {
  modulesCache.clear()
  modulesCache.set('unocss', __unocss)
}

/**
 * Evaluate the user config
 * @param {string} configStr - The string representation of the user config
 * @param {boolean} [isApplet] - Whether the config is for applet
 * @returns The evaluated user config
 */
export async function evaluateUserConfig<U = UserConfig>(configStr: string, isApplet: boolean = false): Promise<U | undefined> {
  let code = configStr
    .replace(/import\s(.*?)\sfrom\s*(['"])unocss\2/g, 'const $1 = await __import("unocss");')
    .replace(/import\s*(\{[\s\S]*?\})\s*from\s*(['"])([\w@/-]+)\2/g, 'const $1 = await __import("$3");')
    .replace(/import\s(.*?)\sfrom\s*(['"])([\w@/-]+)\2/g, 'const $1 = (await __import("$3")).default;')
    .replace(/export default /, 'return ')
    .replace(/\bimport\s*\(/, '__import(')

  if (isApplet) {
    code = code.replace(/const isApplet\s*=\s(.*?)false/g, 'const isApplet = true')
  }

  // bypass vite interop
  // eslint-disable-next-line no-new-func
  const _import = new Function('a', 'return import(a);')
  const __import = (name: string): any => {
    if (!modulesCache.has(name)) {
      modulesCache.set(
        name,
        name.endsWith('.json')
          ? $fetch(CDN_BASE + name, { responseType: 'json' }).then(r => ({ default: r }))
          : _import(CDN_BASE + name),
      )
    }
    return modulesCache.get(name)
  }

  const fn = new AsyncFunction('__import', code)
  const result = await fn(__import)

  if (result)
    return result
}

export const quotedArbitraryValuesRE
  = /(?:[\w&:[\]-]|\[\S{1,64}=\S{1,64}\]){1,64}\[\\?['"]?\S{1,64}?['"]\]\]?[\w:-]{0,64}/g

export const arbitraryPropertyRE
  = /\[(\\\W|[\w-]){1,64}:[^\s:]{0,64}?("\S{1,64}?"|'\S{1,64}?'|`\S{1,64}?`|[^\s:]{1,64}?)[^\s:]{0,64}?\)?\]/g

export function getMatchedPositions(code: string, matched: string[]) {
  const result: (readonly [line: number, start: number, end: number, text: string])[] = []
  const attributify: RegExpMatchArray[] = []
  const plain = new Set<string>()

  Array.from(matched)
    .forEach((v) => {
      const match = isAttributifySelector(v)
      if (!match) {
        // highlightLessGreaterThanSign(v)
        plain.add(v)
      }
      else if (!match[2]) {
        // highlightLessGreaterThanSign(match[1])
        plain.add(match[1])
      }
      else { attributify.push(match) }
    })

  // highlight classes that includes `><`
  // function highlightLessGreaterThanSign(str: string) {
  //   if (/[><]/.test(str)) {
  //     for (const match of code.matchAll(new RegExp(escapeRegExp(str), 'g'))) {
  //       const start = match.index!
  //       const end = start + match[0].length
  //       result.push([start, end, match[0]])
  //     }
  //   }
  // }

  code.split('\n').forEach((line, index) => {
    // highlight for plain classes
    let start = 0
    line.split(splitWithVariantGroupRE).forEach((i) => {
      const end = start + i.length
      if (plain.has(i))
        result.push([index + 1, start, end, i])
      start = end
    })

    // highlight for quoted arbitrary values
    for (const match of line.matchAll(quotedArbitraryValuesRE)) {
      const start = match.index!
      const end = start + match[0].length
      if (plain.has(match[0]))
        result.push([index + 1, start, end, match[0]])
    }

    // highlight for arbitrary css properties
    for (const match of line.matchAll(arbitraryPropertyRE)) {
      const start = match.index!
      const end = start + match[0].length
      if (plain.has(match[0])) {
      // non-quoted arbitrary properties already highlighted by plain class highlighter
        const index = result.findIndex(([s, e]) => s === start && e === end)
        if (index < 0)
          result.push([index + 1, start, end, match[0]])
      }
    }

    // attributify values
    attributify.forEach(([, name, value]) => {
      const regex = new RegExp(`(${escapeRegExp(name)}=)(['"])[^\\2]*?${escapeRegExp(value)}[^\\2]*?\\2`, 'g')
      Array.from(line.matchAll(regex))
        .forEach((match) => {
          const escaped = match[1]
          const body = match[0].slice(escaped.length)
          let bodyIndex = body.match(`[\\b\\s'"]${escapeRegExp(value)}[\\b\\s'"]`)?.index ?? -1
          if (/[\s'"]/.test(body[bodyIndex] ?? ''))
            bodyIndex++
          if (bodyIndex < 0)
            return
          const start = match.index! + escaped.length + bodyIndex
          const end = start + value.length
          result.push([index + 1, start, end, `[${name}="${value}"]`])
        })
    })
  })

  return result.sort((a, b) => a[0] - b[0])
}
