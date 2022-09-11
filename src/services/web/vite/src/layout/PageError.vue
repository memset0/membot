<script setup lang="ts">
const { code, message } = usePageData().data
</script>
	
<template>
  <div>
    Error {{ code }}: {{ message }}
  </div>
</template>