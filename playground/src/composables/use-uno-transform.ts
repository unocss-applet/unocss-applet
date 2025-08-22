import type { HighlightAnnotation, UnocssPluginContext, UnoGenerator } from 'unocss'
import MagicString from 'magic-string'
import { storeToRefs } from 'pinia'
import { useUnoStore, useUrlStore } from '~/stores'

export function cleanOutput(code: string) {
  return code.replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\n\s+/g, '\n')
    .trim()
}

async function applyTransformers(uno: UnoGenerator<object>, code: MagicString, id: string, enforce?: 'pre' | 'post') {
  let { transformers } = uno.config
  transformers = (transformers ?? []).filter(i => i.enforce === enforce)

  if (!transformers.length)
    return []

  const annotations = []
  const tokens = new Set<string>()
  const fakePluginContext = { uno, tokens } as UnocssPluginContext
  for (const { idFilter, transform } of transformers) {
    if (idFilter && !idFilter(id))
      continue
    const result = await transform(code, id, fakePluginContext)
    const _annotations = result?.highlightAnnotations
    if (_annotations)
      annotations.push(..._annotations)
  }
  return annotations
}

export function useUnoTransform() {
  const { customHTMLRaw, customCSSRaw } = storeToRefs(useUrlStore())
  const { __uno, customCSSWarn, transformedHTML, transformedCSS } = storeToRefs(useUnoStore())

  async function transformHTML() {
    if (!__uno.value) {
      return
    }
    const uno = await __uno.value
    transformedHTML.value = await getTransformed(uno, 'html')
  }

  async function transformCSS() {
    if (!__uno.value) {
      return
    }
    const uno = await __uno.value
    transformedCSS.value = await getTransformed(uno, 'css')
  }

  async function getTransformed(uno: UnoGenerator<object>, type: 'html' | 'css') {
    const isHTML = type === 'html'
    const id = isHTML ? 'input.vue' : 'input.css'
    const input = new MagicString(isHTML ? customHTMLRaw.value : customCSSRaw.value)

    const _annotations: HighlightAnnotation[] = []
    _annotations.push(...await applyTransformers(uno, input, id, 'pre'))
    _annotations.push(...await applyTransformers(uno, input, id))
    _annotations.push(...await applyTransformers(uno, input, id, 'post'))

    return { output: isHTML ? input.toString() : cleanOutput(input.toString()), annotations: _annotations }
  }

  async function detectTransformer() {
    if (!__uno.value) {
      return
    }
    const uno = await __uno.value
    const { transformers = [] } = uno.config
    if (!transformers.some(t => t.name === '@unocss/transformer-directives')) {
      const msg = 'Using directives requires \'@unocss/transformer-directives\' to be installed.'
      customCSSWarn.value = new Error(msg)
      transformedCSS.value = { output: customCSSRaw.value, annotations: [] }
    }
    else {
      transformedCSS.value = await getTransformed(uno, 'css')
    }
  }

  return {
    transformHTML,
    transformCSS,

    applyTransformers,
    getTransformed,
    detectTransformer,
  }
}
