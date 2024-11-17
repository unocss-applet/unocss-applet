/* eslint-disable regexp/optimal-quantifier-concatenation */
/* eslint-disable regexp/strict */
/* eslint-disable regexp/no-super-linear-backtracking */
import type { HighlightAnnotation, UserConfig } from '@unocss/core'
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

export async function evaluateUserConfig<U = UserConfig>(configStr: string): Promise<U | undefined> {
  const code = configStr
    .replace(/import\s*(.*?)\s*from\s*(['"])unocss\2/g, 'const $1 = await __import("unocss");')
    .replace(/import\s*(\{[\s\S]*?\})\s*from\s*(['"])([\w-@/]+)\2/g, 'const $1 = await __import("$3");')
    .replace(/import\s*(.*?)\s*from\s*(['"])([\w-@/]+)\2/g, 'const $1 = (await __import("$3")).default;')
    .replace(/export default /, 'return ')
    .replace(/\bimport\s*\(/, '__import(')

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

export const quotedArbitraryValuesRE = /(?:[\w&:[\]-]|\[\S[^\s=]*=\S+\])+\[\\?['"]?\S+?['"]\]\]?[\w:-]*/g
export const arbitraryPropertyRE = /\[(\\\W|[\w-])+:[^\s:]*?("\S+?"|'\S+?'|`\S+?`|[^\s:]+?)[^\s:]*?\)?\]/g

export function getPlainClassMatchedPositionsForPug(codeSplit: string, matchedPlain: Set<string>, start: number) {
  const result: [number, number, string][] = []
  matchedPlain.forEach((plainClassName) => {
    // normal case: match for 'p1'
    // end with EOL : div.p1
    // end with . : div.p1.ma
    // end with # : div.p1#id
    // end with = : div.p1= content
    // end with space : div.p1 content
    // end with ( :  div.p1(text="red")

    // complex case: match for hover:scale-100
    // such as [div.hover:scale-100] will not be parsed correctly by pug
    // should use [div(class='hover:scale-100')]

    // combine both cases will be 2 syntax
    // div.p1(class='hover:scale-100')
    // div(class='hover:scale-100 p1') -> p1 should be parsing as well
    if (plainClassName.includes(':')) {
      if (plainClassName === codeSplit)
        result.push([start, start + plainClassName.length, plainClassName])
    }
    else {
      const regex = new RegExp(`\.(${plainClassName})[\.#=\s(]|\.(${plainClassName})$`)
      const match = regex.exec(codeSplit)
      if (match) {
        // keep [.] not include -> .p1 will only show underline on [p1]
        result.push([start + match.index + 1, start + match.index + plainClassName.length + 1, plainClassName])
      }
      else {
        // div(class='hover:scale-100 p1') -> parsing p1
        // this will only be triggered if normal case fails
        if (plainClassName === codeSplit)
          result.push([start, start + plainClassName.length, plainClassName])
      }
    }
  })

  return result
}

export function getMatchedPositions(
  code: string,
  matched: string[],
  extraAnnotations: HighlightAnnotation[] = [],
  isPug = false,
) {
  const result: (readonly [start: number, end: number, text: string])[] = []
  const attributify: RegExpMatchArray[] = []
  const plain = new Set<string>()

  Array.from(matched)
    .forEach((v) => {
      const match = isAttributifySelector(v)
      if (!match) {
        highlightLessGreaterThanSign(v)
        plain.add(v)
      }
      else if (!match[2]) {
        highlightLessGreaterThanSign(match[1])
        plain.add(match[1])
      }
      else { attributify.push(match) }
    })

  // highlight classes that includes `><`
  function highlightLessGreaterThanSign(str: string) {
    if (/[><]/.test(str)) {
      for (const match of code.matchAll(new RegExp(escapeRegExp(str), 'g'))) {
        const start = match.index!
        const end = start + match[0].length
        result.push([start, end, match[0]])
      }
    }
  }

  // highlight for plain classes
  let start = 0
  code.split(splitWithVariantGroupRE).forEach((i) => {
    const end = start + i.length
    if (isPug) {
      result.push(...getPlainClassMatchedPositionsForPug(i, plain, start))
    }
    else {
      if (plain.has(i))
        result.push([start, end, i])
    }
    start = end
  })

  // highlight for quoted arbitrary values
  for (const match of code.matchAll(quotedArbitraryValuesRE)) {
    const start = match.index!
    const end = start + match[0].length
    if (plain.has(match[0]))
      result.push([start, end, match[0]])
  }

  // highlight for arbitrary css properties
  for (const match of code.matchAll(arbitraryPropertyRE)) {
    const start = match.index!
    const end = start + match[0].length
    if (plain.has(match[0])) {
      // non-quoted arbitrary properties already highlighted by plain class highlighter
      const index = result.findIndex(([s, e]) => s === start && e === end)
      if (index < 0)
        result.push([start, end, match[0]])
    }
  }

  // attributify values
  attributify.forEach(([, name, value]) => {
    const regex = new RegExp(`(${escapeRegExp(name)}=)(['"])[^\\2]*?${escapeRegExp(value)}[^\\2]*?\\2`, 'g')
    Array.from(code.matchAll(regex))
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
        result.push([start, end, `[${name}="${value}"]`])
      })
  })

  result.push(...extraAnnotations.map(i => [i.offset, i.offset + i.length, i.className] as const))

  return result.sort((a, b) => a[0] - b[0])
}
