<script setup lang="ts">
import Note from './components/Note.vue'

import { NoteMeta } from '../types'

const notes = usePageData().data.notes as Array<NoteMeta>
</script>

<template>
	<div>
		<Note v-for="note in notes" :note="note"/>
	</div>
</template>