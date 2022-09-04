import { Context } from 'koishi'

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

export function getUserName(platform: string, channelId: string, ctx?: Context): null | string {
	return null
}

export function getChannelName(platform: string, channelId: string, ctx?: Context): null | string | Promise<string> {
	if (channelId.startsWith('private:')) {
		return getUserName(platform, channelId.slice(8), ctx)
	}
	if (ctx && platform === 'onebot') {
		for (const bot of ctx.bots) {
			if (bot.platform === 'onebot') {
				return bot.internal.getGroupInfo(channelId)
					.then((groupInfo) => {
						console.log(channelId, groupInfo)
						return groupInfo.group_name
					})
			}
		}
	}
	return null
}