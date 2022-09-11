<template>
	<a target="_blank">
		<slot />
	</a>
</template>

<style scoped>
a {
	color: inherit;
	text-decoration: inherit;
	transition: opacity .25s;
}

a:hover {
	opacity: 0.5;
}
</style>