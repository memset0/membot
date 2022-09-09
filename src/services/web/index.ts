import { Context } from 'koishi'
import Koa from 'koa'

import { WebService } from './app'
import { getChannelAvatar, getChannelName } from '../../utils/avatar'

export const name = 'web' as const

declare module 'koishi' {
	interface Context {
		web: WebService
	}
}

export interface Config {
	key: string
	port: number
	hostname: string
	logoUrl: string
	faviconUrl: string
	proxyPrefix: Array<string>
}


export function apply(ctx: Context, config: Config) {
	if (!config.key) {
		throw new Error('Web services require a key for security')
	}
	config.port = config.port || 3000
	config.hostname = config.hostname || `http://localhost:${config.port}`
	config.proxyPrefix = config.proxyPrefix || []

	// const globalArgs = {
	// 	koishi: ctx.app.options,
	// 	title: 'membot',
	// 	config,
	// 	displayId: undefined,
	// 	displayName: undefined,
	// 	displayAvatar: undefined,
	// }

	// async function handleArgs(data: any) {
	// 	for (const key in globalArgs) {
	// 		if (!(key in data)) {
	// 			data[key] = globalArgs[key]
	// 		}
	// 	}
	// 	if (data.session) {
	// 		data.displayId = data.session.subtype === 'private' ? data.session.userId : data.session.channelId
	// 		data.displayName = data.displayName
	// 			|| (data.session.subtype === 'private' && data.session.username)
	// 			|| (await getChannelName(data.session.platform, data.session.channelId, ctx))
	// 			|| (data.session.platform + ':' + data.displayId)
	// 		data.displayAvatar = data.displayAvatar
	// 			|| (await getChannelAvatar(data.session.platform, data.session.channelId, ctx))
	// 	}
	// 	return data
	// }

	Context.service('web')
	const app = new Koa()
	ctx.app.web = new WebService(ctx, app, config)
}