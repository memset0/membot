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

const pageTitle = ref('')
// const id = computed(() => usePageData().id)
const user = computed(() => usePageData().user)
const channel = computed(() => usePageData().channel)
</script>

<template>
	<div class="header" :class="onTop ? '' : 'header-scrolled'">
		<div class="container header-container">
			<div class="header-content">
				<a-page-header :style="{ background: 'var(--color-bg-2)' }" :subtitle="pageTitle" :show-back="false">
					<template #title>
						<a href="/">membot</a>
					</template>
					<template #extra>
						<div class="header-extra">
							<HeaderAvatar :user="user" :channel="channel" />
							<ExternalLink href="https://github.com/memset0/membot">
								<div class="header-avatar header-avatar-icon">
									<icon-github :size="24" />
								</div>
							</ExternalLink>
						</div>
					</template>
				</a-page-header>
			</div>
		</div>
	</div>
</template>

<style lang="scss">
.header {
	.arco-page-header {
		.arco-icon-hover {
			padding-left: 2px;
			padding-right: 2px;
		}
	}

	.arco-page-header-title>a {
		color: inherit;
		text-decoration: none;
	}
}
</style>

<style scoped lang="scss">
.header {
	position: fixed;
	top: 0;
	left: 0;
	background: white;
	width: 100%;
	z-index: 100;

	.header-content {
		margin-left: -12px;
		margin-right: -12px;
	}
}

.header-extra {
	.header-avatar {
		display: inline-flex;
		margin-left: 16px;
		position: relative;
		align-items: center;
		vertical-align: middle;
	}
}

// 滚动阴影动画
.header {

	box-shadow: 0 2px 1px -1px rgb(0 0 0 / 12%),
		0 1px 1px 0 rgb(0 0 0 / 10%),
		0 1px 3px 0 rgb(0 0 0 / 08%);
	transition: box-shadow .2s;

	&.header-scrolled {
		box-shadow: 0 4px 2px -2px rgb(0 0 0 / 09%),
			0 3px 3px 0 rgb(0 0 0 / 06%),
			0 3px 6px 0 rgb(0 0 0 / 04%);
	}
}
</style>