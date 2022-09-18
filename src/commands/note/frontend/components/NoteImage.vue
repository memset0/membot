<script setup lang="ts">
defineProps<{
	image: string,
}>()
</script>

<template>
	<img alt="note-image" class="note-image" :style="{ width: '100%' }" :src="image" />
</template>