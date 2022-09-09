<script lang="ts">
export default {
  data() {
    return this.$root.data
    // return {
    //   code: this.$root.data.code,
    //   message: this.$root.data.message,
    // }
  },
}
</script>
	
<template>
  <div>
    <n-alert title="We encountered a problem." type="error">
      Error <span v-text="code"></span>: <span v-text="message"> </span>
    </n-alert>
  </div>
</template>