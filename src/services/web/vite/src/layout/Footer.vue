<script setup lang="ts">
import ExternalLink from '../components/ExternalLink.vue';
const { logoUrl } = useSiteData()
</script>

<template>
	<div class="footer">
		<div class="container footer-container">
			<Avatar :src="logoUrl" />
			<p>
				Yet Another Open Source
				&amp;
				Cross-platform Chatbot
			</p>
			<p>
				Powered by
				<ExternalLink href="https://github.com/koishijs/koishi" class="footer-link">koishi</ExternalLink>
				&nbsp;·&nbsp;
				Code by
				<ExternalLink href="https://github.com/memset0" class="footer-link">memset0</ExternalLink>
			</p>
		</div>
	</div>
</template>

<style scoped>
.footer {
	/* background: rgb(229, 230, 235); */
	margin-top: 12px;
}

.footer-container {
	text-align: center;
	padding: 20px;
	color: rgb(var(--gray-6));
}

.footer-link {}
</style>