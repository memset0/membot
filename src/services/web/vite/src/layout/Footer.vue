<script setup lang="ts">
const { logoUrl } = useSiteData()
</script>

<template>
	<div class="footer">
		<div class="container footer-container">
			<Avatar :src="logoUrl"/>
			<p>Yet Another Open Source &amp; Cross-platform Chatbot</p>
			<p>Powered by koishi&nbsp;&nbsp;·&nbsp;&nbsp;Code by memset0</p>
		</div>
	</div>
</template>

<style scoped>
.footer {
	/* background: rgb(229, 230, 235); */
	margin-top: 60px;
}

.footer-container {
	text-align: center;
	padding: 20px;
	color: rgb(var(--gray-6));
}
</style>