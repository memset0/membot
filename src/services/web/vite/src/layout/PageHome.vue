<script setup lang="ts">
// import { IconFile } from '@arco-design/web-vue/es/icon';
const { readme } = usePageData().data
</script>

<template>
	<a-card>
		<template #title>
			<icon-file />
			README.md
		</template>
		<Markdown :html="readme" />
	</a-card>
</template>