import { Bot, Context } from 'koishi'

function switchBot(ctx: Context, platform: string): null | Bot {
	for (const bot of ctx.bots) {
		if (bot.platform === platform) { return bot }
	}
	return null
}

export function getUserAvatar(platform: string, userId: string): null | string {
	if (platform === 'onebot') {
		return `https://q.qlogo.cn/headimg_dl?dst_uin=${userId}&spec=640`
	}
	return null
}

export function getChannelAvatar(platform: string, channelId: string): null | string {
	if (channelId.startsWith('private:')) {
		return getUserAvatar(platform, channelId.slice(8))
	}
	if (platform === 'onebot') {
		return `https://p.qlogo.cn/gh/${channelId}/${channelId}/0`
	}
	return null
}

export function getUserName(platform: string, userId: string, ctx?: Context): null | string {
	if (ctx && platform === 'telegram') {
		return switchBot(ctx, 'telegram').internal.getChat({ chat_id: userId })
			.then((chat) => {
				return chat.title
			})
	}
	return null
}

export function getChannelName(platform: string, channelId: string, ctx?: Context): null | string | Promise<string> {
	if (channelId.startsWith('private:')) {
		return getUserName(platform, channelId.slice(8), ctx)
	}
	if (ctx && platform === 'onebot') {
		return switchBot(ctx, 'onebot').internal.getGroupInfo(channelId)
			.then((groupInfo) => {
				return groupInfo.group_name
			})
	}
	if (ctx && platform === 'telegram') {
		return switchBot(ctx, 'telegram').internal.getChat({ chat_id: channelId })
			.then((chat) => {
				return chat.title
			})
	}
	return null
}