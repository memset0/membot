<script lang="ts">
export default {
	props: ['html'],
}
</script>

<template>
	<div class="markdown" v-html="html">
	</div>
</template>

<style>
</style>