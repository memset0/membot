<script setup lang="ts">
defineProps<{
	html: string,
}>()
</script>

<template>
	<div class="markdown" v-html="html">
	</div>
</template>