<script setup lang="ts">
const { readme } = usePageData().data
</script>

<template>
	<div>
		<Markdown :html="readme" />
	</div>
</template>