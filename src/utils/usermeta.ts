import { Bot, Context, Time } from 'koishi'
import md5 from 'md5'
import LRU from 'lru-cache'
import { TelegramBot } from '@satorijs/adapter-telegram'

export interface UserMeta {
	id: string
	name?: string
	avatar?: string
}

export interface ChannelMeta {
	id: string
	name?: string
	avatar?: string
}

type Handler = (platform: string, id: string, ctx?: Context) => Promise<any>

function switchBot(ctx: Context, platform: string): null | Bot {
	for (const bot of ctx.bots) {
		if (bot.platform === platform) { return bot }
	}
	return null
}

class UserMetaCache {
	cache: LRU<string, any>

	decorate<T extends Handler>(foo: T, name: string): T {
		return (async (...args) => {
			if (args.length < 2 || !args[0] || !args[1]) { return null }
			const key = md5(JSON.stringify([name, args[0], args[1]]))
			let result: any
			if (!(result = this.cache.get(key))) {
				result = await foo(...args)
				this.cache.set(key, result)
			}
			return result
		}) as T
	}

	constructor() {
		this.cache = new LRU<string, any>({
			max: 100,
			ttl: Time.day * 5,
			allowStale: false,
			updateAgeOnGet: true,
		})
	}
}

export const cache = new UserMetaCache()
export const getUser = cache.decorate(_getUser, 'user')
export const getUserName = cache.decorate(_getUserName, 'user-name')
export const getUserAvatar = cache.decorate(_getUserAvatar, 'user-avatar')
export const getChannel = cache.decorate(_getChannel, 'channel')
export const getChannelName = cache.decorate(_getChannelName, 'channel-name')
export const getChannelAvatar = cache.decorate(_getChannelAvatar, 'channel-avatar')

export async function _getUser(platform: string, userId: string, ctx?: Context): Promise<UserMeta>{
	let res: any
	const user = { id: userId } as UserMeta
	if (res = await getUserName(platform, userId, ctx)) { user.name = res }
	if (res = await getUserAvatar(platform, userId, ctx)) { user.avatar = res }
	return user
}

export async function _getChannel(platform: string, channelId: string, ctx?: Context):Promise<ChannelMeta> {
	let res: any
	const channel = { id: channelId } as ChannelMeta
	if (res = await getChannelName(platform, channelId, ctx)) { channel.name = res }
	if (res = await getChannelAvatar(platform, channelId, ctx)) { channel.avatar = res }
	return channel
}

export async function _getUserAvatar(platform: string, userId: string, ctx?: Context) {
	if (platform === 'onebot') {
		return `https://q.qlogo.cn/headimg_dl?dst_uin=${userId}&spec=640`
	}
	if (ctx && platform === 'telegram') {
		const bot = switchBot(ctx, 'telegram') as unknown as TelegramBot
		const chat = await bot.internal.getChat({ chat_id: userId })
		const file = await bot.internal.getFile({ file_id: chat.photo.small_file_id })
		const res = await bot.http.file.get(`/${file.file_path}`, { responseType: 'arraybuffer' })
		const base64 = `data:image/jpeg;base64,` + res.toString('base64')
		return base64
	}
	return null
}

export async function _getChannelAvatar(platform: string, channelId: string, ctx?: Context) {
	if (channelId.startsWith('private:')) {
		return getUserAvatar(platform, channelId.slice(8))
	}
	if (platform === 'onebot') {
		return `https://p.qlogo.cn/gh/${channelId}/${channelId}/0`
	}
	if (ctx && platform === 'telegram') {
		const bot = switchBot(ctx, 'telegram') as unknown as TelegramBot
		const chat = await bot.internal.getChat({ chat_id: channelId })
		const file = await bot.internal.getFile({ file_id: chat.photo.small_file_id })
		const res = await bot.http.file.get(`/${file.file_path}`, { responseType: 'arraybuffer' })
		const base64 = `data:image/jpeg;base64,` + res.toString('base64')
		return base64
	}
	return null
}

export async function _getUserName(platform: string, userId: string, ctx?: Context) {
	if (ctx && platform === 'telegram') {
		const chat = await switchBot(ctx, 'telegram').internal.getChat({ chat_id: userId })
		return chat.title
	}
	return null
}

export async function _getChannelName(platform: string, channelId: string, ctx?: Context) {
	if (channelId.startsWith('private:')) {
		return getUserName(platform, channelId.slice(8), ctx)
	}
	if (ctx && platform === 'onebot') {
		const group = await switchBot(ctx, 'onebot').internal.getGroupInfo(channelId)
		return group.group_name
	}
	if (ctx && platform === 'telegram') {
		const chat = await switchBot(ctx, 'telegram').internal.getChat({ chat_id: channelId })
		return chat.title
	}
	return null
}