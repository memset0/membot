<script setup lang="ts">
import NoteImageGroup from './NoteImageGroup.vue'
import { NoteMeta } from '../../types'
defineProps<{
	note: NoteMeta,
}>()
</script>
	
<template>
	<div>
		<a-card class="main-card note-card">
			<template #cover>
				<NoteImageGroup v-if="note.extend.images && note.extend.images.length" :images="note.extend.images" />
			</template>
			<a-card-meta>
				<template #description>
					<div class="note-content" v-html="note.content">
					</div>
				</template>
				<!-- <template #avatar>
					<div :style="{ display: 'flex', alignItems: 'center', color: '#1D2129' }">
						<a-avatar :size="24" :style="{ marginRight: '8px' }">
							A
						</a-avatar>
						<a-typography-text></a-typography-text>
					</div>
				</template> -->
			</a-card-meta>
		</a-card>
	</div>
</template>

<style lang="scss">
.note-card {
	max-width: 600px;
	margin-left: auto;
	margin-right: auto;
	margin-bottom: 16px;
	overflow: hidden;

	&>.arco-card-body {
		padding: 12px !important;
	}

	.note-content {
		color: black;

		&>*:first-child {
			margin-block-start: 0 !important;
			margin-inline-start: 0 !important;
			margin-top: 0 !important;
		}

		&>*:last-child {
			margin-block-end: 0 !important;
			margin-inline-end: 0 !important;
			margin-bottom: 0 !important;
		}
	}

	.note-image-group {
		border-bottom: 1px solid var(--color-neutral-3);
	}
}
</style>