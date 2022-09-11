<script setup lang="ts">
const { readme } = usePageData().data
</script>

<template>
	<a-card style="border-radius: 10px;">
		<template #title>
			<div class="readme-header">
				<IconFile :style="{fontSize:'14px',marginRight:'10px'}" />
				README.md
			</div>
		</template>
		<!-- <template #extra>
			<a-link href="">More</a-link>
		</template> -->
		<Markdown :html="readme" />
	</a-card>
</template>

<style scoped lang="scss">
.readme-header {
	color: rgb(var(--gray-8));
	font-size: 13px;
	font-weight: bold;
	padding: 20px 0px;
}
</style>