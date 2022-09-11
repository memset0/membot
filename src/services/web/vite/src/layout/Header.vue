<script setup lang="ts">
</script>

<template>
	<div class="header">
		<div class="container header-container">
			<a-menu :selectedKeys="['home']" mode='horizontal'>
				<a-menu-item key="home">
					<a-link href="/">membot</a-link>
				</a-menu-item>
				<!-- <a-menu-item key="0_2">
				<icon-calendar />
				Menu 2
			</a-menu-item> -->
			</a-menu>
		</div>
	</div>
</template>

<style scoped>
.header {
	position: fixed;
	top: 0;
	left: 0;
	background: white;
	width: 100%;
	z-index: 100;
}
</style>