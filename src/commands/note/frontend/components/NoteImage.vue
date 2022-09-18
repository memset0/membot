<script setup lang="ts">
defineProps<{
	image: string,
}>()
</script>

<template>
	<a-image alt="note-image" class="note-image" :src="image" width="100%" fit="contain">
		<!-- <template #extra>
			<div class="note-image-extra">
				<a-tooltip content="click to view the full image">
					<span class="action">...</span>
				</a-tooltip>
			</div>
		</template> -->
	</a-image>
</template>

<style lang="scss">
.note-card {
	.note-image {
		overflow: hidden;
		max-height: 240px;

		img {
			width: 100%;
		}
	}

	.arco-image-footer-extra {
		width: 100%;

		.note-image-extra {
			width: 100%;
			text-align: right;
		}
	}
}
</style>