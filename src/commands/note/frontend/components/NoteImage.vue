<script setup lang="ts">
defineProps<{
	image: string,
}>()
</script>

<template>
	<a-image alt="note-image" class="note-image" :src="image" />
</template>

<style scoped>
.note-image {
	max-height:300px;
}
</style>