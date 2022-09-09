<script lang="ts">
export default {
	data() { return this.$root.data },
}
</script>

<template>
	<n-card>
		<pre><code v-html="text"></code></pre>
	</n-card>
</template>