<script setup lang="ts">
const onTop = ref(true)
function onScroll() {
	const distanceToTop = document.documentElement.scrollTop || document.body.scrollTop;
	if (distanceToTop < 100) {
		if (!onTop.value) { onTop.value = true }
	} else {
		console.log('scroll', distanceToTop)
		if (onTop.value) { onTop.value = false }
	}
}

onMounted(() => { window.addEventListener('scroll', onScroll) })
onUnmounted(() => { window.removeEventListener('scroll', onScroll) })
</script>

<template>
	<div class="header" :class="onTop ? '' : 'header-scrolled'">
		<div class="container header-container">
			<div class="header-menu">
				<a-menu :selectedKeys="['home']" mode='horizontal'>
					<a href="/">
						<a-menu-item key="home">
							membot
						</a-menu-item>
					</a>
				</a-menu>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.header {
	position: fixed;
	top: 0;
	left: 0;
	background: white;
	width: 100%;
	z-index: 100;

	.header-menu {
		margin-left: -16px;
		margin-right: -16px;
	}
}

// 滚动阴影动画
.header {

	box-shadow: 0 2px 1px -1px rgb(0 0 0 / 12%),
		0 1px 1px 0 rgb(0 0 0 / 10%),
		0 1px 3px 0 rgb(0 0 0 / 08%);
	transition: box-shadow .15s;

	&.header-scrolled {
		box-shadow: 0 3px 2px -2px rgb(0 0 0 / 12%),
			0 2px 2px 0 rgb(0 0 0 / 10%),
			0 2px 4px 0 rgb(0 0 0 / 08%);
	}
}
</style>