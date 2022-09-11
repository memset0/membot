<script setup lang="ts">
const { text } = usePageData().data
</script>

<template>
	<pre><code v-html="text"></code></pre>
</template>