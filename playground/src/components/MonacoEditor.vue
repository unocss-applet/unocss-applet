<!-- eslint-disable new-cap -->
<script setup lang="ts">
import { shikiToMonaco } from '@shikijs/monaco'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

import { createHighlighter } from 'shiki'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { isDark } from '~/composables/dark'

const props = defineProps<{
  modelValue: string
  language?: 'html' | 'css' | 'javascript'
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

    editor.onDidChangeModelContent(() => {
      emit('update:modelValue', editor!.getValue())
    })
  }
})

watch(isDark, (value) => {
  monaco.editor.setTheme(value ? 'vitesse-dark' : 'vitesse-light')
})

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
