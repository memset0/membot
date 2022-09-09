<script lang="ts">
export default {
	data() { return this.$root.data },
}
</script>

<template>
	<n-card>
		<Markdown :html="readme" />
	</n-card>
</template>