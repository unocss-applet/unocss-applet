<script lang='ts' setup>
import { toggleDark } from '~/composables/dark'
import { VERSION } from '~/constants'

function handleReset() {
  // eslint-disable-next-line no-alert
  if (confirm('Reset all settings? It can NOT be undone.')) {
    // handleResetConfig()
  }
}
</script>

<template>
  <div
    class="flex items-center h-10 px-2 op-60 bg-gray/10 w-full justify-between border-l border-t border-gray-400/20"
  >
    <div class="flex items-center gap-2">
      <img src="/icon.svg" w-8 h-8>
      <div text-sm>
        UnoCSS Applet Playground
      </div>
      <div text-xs op50>
        v{{ VERSION }}
      </div>
    </div>

    <div class="flex items-center space-x-2 pl-1 text-lg">
      <button class="i-tabler-eraser" title="Reset To Default" @click="handleReset" />
      <a
        class="i-tabler-brand-github" href="https://github.com/unocss-applet/unocss-applet" target="_blank"
        title="GitHub"
      />
      <button class="i-tabler-sun dark:i-tabler-moon" title="Toggle Color Mode" @click="toggleDark" />
    </div>
  </div>
</template>
