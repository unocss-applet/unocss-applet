<script setup lang="ts">
import HeaderBar from './components/HeaderBar.vue'
import Preview from './components/Preview.vue'
import Editor from './components/Editor.vue'
import Output from './components/Output.vue'
</script>

<template>
  <div class="font-sans leading-1em h-screen w-screen">
    <HeaderBar />
    <div class="flex absolute inset-0 top-10">
      <Preview class="flex-1" />
      <Editor class="flex-1" />
      <Output class="flex-1" />
    </div>
  </div>
</template>

<style scoped>
</style>
