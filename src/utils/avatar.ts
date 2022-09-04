import { Bot, Context } from 'koishi'
import { TelegramBot } from '@satorijs/adapter-telegram'

function switchBot(ctx: Context, platform: string): null | Bot {
	for (const bot of ctx.bots) {
		if (bot.platform === platform) { return bot }
	}
	return null
}

export function getUserAvatar(platform: string, userId: string, ctx?: Context): null | string | Promise<string> {
	if (platform === 'onebot') {
		return `https://q.qlogo.cn/headimg_dl?dst_uin=${userId}&spec=640`
	}
	if (ctx && platform === 'telegram') {
		return new Promise(async (resolve) => {
			const bot = switchBot(ctx, 'telegram') as unknown as TelegramBot
			const chat = await bot.internal.getChat({ chat_id: userId })
			const file = await bot.internal.getFile({ file_id: chat.photo.small_file_id })
			const res = await bot.http.file.get(`/${file.file_path}`, { responseType: 'arraybuffer' })
			const base64 = `data:image/jpeg;base64,` + res.toString('base64')
			return resolve(base64)
		})
	}
	return null
}

export function getChannelAvatar(platform: string, channelId: string, ctx?: Context): null | string | Promise<string> {
	if (channelId.startsWith('private:')) {
		return getUserAvatar(platform, channelId.slice(8))
	}
	if (platform === 'onebot') {
		return `https://p.qlogo.cn/gh/${channelId}/${channelId}/0`
	}
	if (ctx && platform === 'telegram') {
		return new Promise(async (resolve) => {
			const bot = switchBot(ctx, 'telegram') as unknown as TelegramBot
			const chat = await bot.internal.getChat({ chat_id: channelId })
			const file = await bot.internal.getFile({ file_id: chat.photo.small_file_id })
			const res = await bot.http.file.get(`/${file.file_path}`, { responseType: 'arraybuffer' })
			const base64 = `data:image/jpeg;base64,` + res.toString('base64')
			return resolve(base64)
		})
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