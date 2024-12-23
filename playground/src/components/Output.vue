<script lang="ts" setup>
import { computed, unref } from 'vue'
import { cssFormatted } from '~/composables/prettier'
import { transformedHTML } from '~/composables/uno'
import { inputHTML, options } from '~/composables/url'
import CodeMirror from './CodeMirror.vue'

const computedInputHTML = computed({
  get: () => unref(options.value.transformHtml ? transformedHTML : inputHTML),
  set: (value) => {
    inputHTML.value = value
  },
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden w-full">
    <div>Output</div>
    <div class="overflow-hidden flex-1 flex flex-col relative">
      <div>HTML</div>
      <CodeMirror
        :model-value="transformedHTML ?? computedInputHTML" flex-auto mode="html" class="scrolls border-l border-gray-400/20"
        :read-only="true"
      />
    </div>
    <div class="overflow-hidden flex-1 flex flex-col relative">
      <div>Output CSS</div>
      <CodeMirror
        :model-value="cssFormatted" flex-auto mode="css" border="l gray-400/20" class="scrolls"
        :read-only="true"
      />
    </div>
  </div>
</template>
