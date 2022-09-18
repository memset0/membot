<script setup lang="ts">
import NoteImage from './NoteImage.vue'
defineProps<{
	images: Array<string>,
}>()
</script>

<template>
	<div class="note-image-group">
		<a-image-preview-group>
			<div v-for="image in images">
				<NoteImage :image="image" />
			</div>
		</a-image-preview-group>
	</div>
</template>