<script setup lang="ts">
import { UserMeta, ChannelMeta } from '../../../../../utils/usermeta'

interface DescriptionsItem {
	label: string
	value: string
}

const props = defineProps<{
	user: undefined | UserMeta,
	channel: undefined | ChannelMeta,
}>()
const user = ref<undefined | UserMeta>(undefined)
const channel = ref<undefined | ChannelMeta>(undefined)
const userShort = ref('')
const channelShort = ref('')
const popover: Array<DescriptionsItem> = []

update(props.user, props.channel, popover)
watch(props, () => {
	// console.log('update:', user, channel)
	user.value = props.user
	channel.value = props.channel
	update(props.user, props.channel, popover)
})
onMounted(() => {
	// console.log('mounted:', user, channel)
	user.value = props.user
	channel.value = props.channel
	update(props.user, props.channel, popover)
})


function update(user: undefined | UserMeta, channel: undefined | ChannelMeta, popover: Array<DescriptionsItem>) {
	function addMeta(label: string, value: string) { popover.push({ label, value }) }
	function firstUpper([first, ...rest]: string): string { return first.toUpperCase() + rest.join('') }
	function namePlatform(platform: string) { return platform === 'onebot' ? 'QQ' : firstUpper(platform) }

	userShort.value = user && (user.name || user.id).slice(0, 1)
	channelShort.value = channel && (channel.name || channel.id).slice(0, 1)

	popover.splice(0, popover.length)
	if (user?.platform || channel?.platform) {
		const platform = user?.platform || channel?.platform
		addMeta('Platform', namePlatform(platform))
		if (user && channel && user.platform != channel.platform) {
			addMeta('Channel Platform', namePlatform(channel.platform))
		}
	}
	if (user) {
		if (user.name) { addMeta('User', user.name) }
		addMeta('User ID', user.id)
	}
	if (channel) {
		if (channel.name) { addMeta('Channel', channel.name) }
		if (!channel.id.startsWith('private:')) { addMeta('Channel ID', channel.id) }
	}
}
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
				<a-descriptions :column="1" :data="popover" :align="{ label: 'right' }" />
			</template>
		</a-popover>
	</div>
</template>

<style scoped>
.header-avatar-group {
	display: inline-block;
}
</style>