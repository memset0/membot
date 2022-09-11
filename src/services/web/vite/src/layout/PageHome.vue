<script setup lang="ts">
// import { IconFile } from '@arco-design/web-vue/es/icon';
const { readme } = usePageData().data
</script>

<template>
	<a-card>
		<template #title>
			<div class="readme-header">
				README.md
			</div>
		</template>
		<Markdown :html="readme" />
	</a-card>
</template>

<style scoped>
.readme-header {
	color: rgb(var(--gray-5));
	font-size: 13px;
	font-weight: bold;
}
</style>