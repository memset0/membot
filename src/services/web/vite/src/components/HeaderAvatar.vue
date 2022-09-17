<script setup lang="ts">
import { UserMeta, ChannelMeta } from '../../../../../utils/usermeta'

const { user, channel } = defineProps<{
	user: undefined | UserMeta,
	channel: undefined | ChannelMeta,
}>()
const userShort = user && (user.name || user.id).slice(0, 1)
const channelShort = channel && (channel.name || channel.id).slice(0, 1)
</script>
	
<template>
	<div v-if="user || channel" class="header-avatar-group">
		<a-popover>
			<a-avatar-group :size="28">
				<a-avatar v-if="user" :style="{ backgroundColor: '#7BC616' }" class="header-avatar">
					<img v-if="user.avatar" alt="avatar" :src="user.avatar" />
					<span v-else>{{ userShort }}</span>
				</a-avatar>
				<a-avatar v-if="channel" :style="{ backgroundColor: '#168CFF' }" class="header-avatar">
					<img v-if="channel.avatar" alt="avatar" :src="channel.avatar" />
					<span v-else>{{ channelShort }}</span>
				</a-avatar>
			</a-avatar-group>
			<template #content>
				<p>Here is the text content</p>
				<p>Here is the text content</p>
			</template>
		</a-popover>
	</div>
</template>

<style scoped>
.header-avatar-group {
	display: inline-block;
}
</style>