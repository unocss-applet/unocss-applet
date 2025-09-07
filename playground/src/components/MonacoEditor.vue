<!-- eslint-disable new-cap -->
<script setup lang="ts">
import { shikiToMonaco } from '@shikijs/monaco'
import { useDebounceFn } from '@vueuse/core'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

import { createHighlighter } from 'shiki'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { isDark } from '~/composables/dark'
import { getMatchedPositions } from '~/composables/uno-shared'

const props = defineProps<{
  modelValue: string
  language?: 'html' | 'css' | 'javascript'
  readonly?: boolean
  matched?: Set<string>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

/**
 * https://github.com/vitejs/vite/discussions/1791#discussioncomment-321046
 */
;(globalThis as any).MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  },
} as monaco.Environment

const editorContainer = ref<HTMLDivElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let decorations: monaco.editor.IEditorDecorationsCollection | null = null
let decorationsIds: string[] = []

onMounted(async () => {
  if (editorContainer.value) {
    const highlighter = await createHighlighter({
      themes: [
        'vitesse-dark',
        'vitesse-light',
      ],
      langs: [
        'html',
        'css',
        'javascript',
      ],
    })

    shikiToMonaco(highlighter, monaco)

    monaco.languages.register({ id: 'html' })
    monaco.languages.register({ id: 'css' })
    monaco.languages.register({ id: 'javascript' })

    editor = monaco.editor.create(editorContainer.value, {
      value: props.modelValue,
      language: props.language || 'html',
      automaticLayout: true,
      fontSize: 14,
      theme: 'vitesse-light',
      minimap: {
        enabled: false,
      },
    })

    decorations = editor.createDecorationsCollection()

    editor.onDidChangeModelContent(() => {
      if (!editor) {
        return
      }
      emit('update:modelValue', editor.getValue())
    })
  }
})

const updateDecorations = useDebounceFn(
  (modelValue: string, matched: Set<string>) => {
    const matchedArray = Array.from(matched || [])
    if (!editor || !matchedArray.length || !decorations) {
      return
    }
    editor.removeDecorations(decorationsIds)
    const sourceText = modelValue
    const newDecorations: monaco.editor.IModelDeltaDecoration[] = []

    const positions = getMatchedPositions(sourceText, matchedArray)
    positions.forEach((position) => {
      const [line, start, end] = position
      newDecorations.push({
        range: new monaco.Range(line, start + 1, line, end + 1),
        options: {
          inlineClassName: 'border-b border-b-dashed border-b-current',
        },
      })
    })
    decorationsIds = decorations.set(newDecorations)
  },
  100,
)

watch(
  () => [props.modelValue, props.matched] as const,
  ([modelValue, matched]) => {
    if (props.language !== 'html') {
      return
    }
    updateDecorations(modelValue, matched || new Set())
  },
)

watch(
  () => props.readonly,
  (value) => {
    if (editor) {
      editor.updateOptions({
        readOnly: value,
      })
    }
  },
  {
    immediate: true,
  },
)

watch(
  isDark,
  (value) => {
    monaco.editor.setTheme(value ? 'vitesse-dark' : 'vitesse-light')
  },
  {
    immediate: true,
  },
)

watch(
  () => props.modelValue,
  (newValue) => {
    if (editor && newValue !== editor.getValue()) {
      editor.setValue(newValue)
    }
  },
)

onBeforeUnmount(() => {
  editor?.dispose()
})
</script>

<template>
  <div ref="editorContainer" class="h-full w-full" />
</template>
