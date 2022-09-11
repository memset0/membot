<script setup lang="ts">
import fetch from './fetch'

let layout = ref('loading')
update()

async function update() {
  const newPageData = await fetch()
  const pageData = usePageData()
  console.log('[receive]', pageData, newPageData)
  for (const key in newPageData) {
    pageData[key] = newPageData[key]
  }
  if (newPageData.layout) { layout.value = newPageData.layout }
}
</script>

<template>
  <a-layout style="height: 400px;">
    <a-layout-header>
      <Header />
    </a-layout-header>
    <a-layout-content>
      <div class="container main-container">
        <PageHome v-if="layout === 'home'" />
        <PageError v-else-if="layout === 'error'" />
        <PagePlainText v-else-if="layout === 'plaintext'" />
        <div v-else>No Layout Found: {{ layout }}</div>
      </div>
    </a-layout-content>
    <a-layout-footer>
      <Footer />
    </a-layout-footer>
  </a-layout>
</template>

<style scoped>
.main-container {
  margin-top: 20px;
}
</style>
