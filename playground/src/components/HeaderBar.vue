<script lang='ts' setup>
import { toggleDark } from '~/composables/dark'
import { customConfigRaw, customCSS, inputHTML, options } from '~/composables/url'
import { defaultConfigRaw, defaultCSS, defaultHTML, VERSION } from '~/constants'

function handleReset() {
  // eslint-disable-next-line no-alert
  if (confirm('Reset all settings? It can NOT be undone.')) {
    inputHTML.value = defaultHTML
    customConfigRaw.value = defaultConfigRaw
    options.value.transformHtml = false
    customCSS.value = defaultCSS
  }
}
</script>

<template>
  <div class="flex items-center px-2 op-60 bg-gray/10 h-10 w-full justify-between">
    <div class="flex items-center gap-2">
      <img src="/icon.svg" w-8 h-8>
      <div text-sm>
        UnoCSS Applet Playground
      </div>
      <div text-xs op50>
        v{{ VERSION }}
      </div>
    </div>

    <div class="text-sm flex items-center space-x-2 pl-1">
      <button class="i-tabler-eraser" icon-btn title="Reset To Default" @click="handleReset" />
      <a
        class="i-tabler-brand-github" icon-btn href="https://github.com/unocss-applet/unocss-applet" target="_blank"
        title="GitHub"
      />
      <button class="i-tabler-sun dark:i-tabler-moon" icon-btn title="Toggle Color Mode" @click="toggleDark" />
    </div>
  </div>
</template>
