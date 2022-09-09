<script lang="ts">
import { ref } from 'vue'
import fetch, { PageData } from './fetch'

import PageHome from './pages/Home.vue'
import PageError from './pages/Error.vue'
import PagePlainText from './pages/PlainText.vue'

import Header from './layout/Header.vue'

export default {
  components: {
    PageHome,
    PageError,
    PagePlainText,
    Header,
  },
  data() {
    return {
      layout: ref('loading'),
      data: {},
    }
  },
  methods: {
    async update() {
      const res = await fetch()
      console.log('[receive]', res)
      for (const key in res) {
        this[key] = res[key]
      }
    }
  },
  async mounted() {
    await this.update()
  }
}
</script>

<template>
  <n-loading-bar-provider>
    <n-space vertical size="large">
      <n-layout position="absolute">
        <Header />
        <n-layout content-style="padding: 24px;">
          <div class="main container">
            <PageHome v-if="layout === 'home'" />
            <PageError v-if="layout === 'error'" />
            <PagePlainText v-if="layout === 'plaintext'" />
          </div>
        </n-layout>
      </n-layout>
    </n-space>
  </n-loading-bar-provider>
</template>

<style scoped>

</style>
