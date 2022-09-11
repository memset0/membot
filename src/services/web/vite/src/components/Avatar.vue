<script setup lang="ts">
defineProps<{
	src: string,
}>()
</script>

<template>
	<a-avatar v-if="src" :size="48">
		<img alt="avatar" :src="src" />
	</a-avatar>
	<div v-else style="display: inline-block">
		<a-skeleton :animation="true">
			<a-skeleton-shape shape="circle" size="40" />
		</a-skeleton>
	</div>
</template>