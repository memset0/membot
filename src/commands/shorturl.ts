import { Context, Time, Session, segment } from 'koishi'
import randomstring from 'randomstring'
import Koa from 'koa'

declare module 'koishi' {
	interface Tables {
		shorturl: Shorturl
	}
}

export interface Shorturl {
	id: number
	key: string
	url: string
	count: number
}

export interface Config {
	root: string
	authority: number
}

export const KEY_LENGTH = 6
export const PRE_LENGTH_CHECK = true


export const name = 'shorturl'
export const using = ['web', 'database'] as const

export function shorturlMiddlewareFactory(ctx: Context) {
	return async (net: Koa.Context, next: Koa.Next) => {
		if (!net.url.startsWith('/s/')) {
			return next()
		}

		const key = net.url.slice(3)
		if (!PRE_LENGTH_CHECK || key.length === KEY_LENGTH) {
			const data = (await ctx.database.get('shorturl', { key }))?.[0]
			if (data) {
				// await ctx.database.update('shorturl', {})
				net.status = 302
				net.redirect(data.url)
			} else {
				net.status = 404
			}
		} else {
			net.status = 404
		}

		if (net.status === 404) {
			net.body = '404 Not Found: The shorturl you requested is not found on this server.'
		}
	}
}

export default function (ctx: Context, config: Config) {
	async function generateKey(): Promise<string> {
		let key: string
		do {
			key = randomstring.generate({
				length: KEY_LENGTH,
				charset: 'alphanumeric'
			})
		} while ((await ctx.database.get('shorturl', { key })).length !== 0)
		return key
	}

	function userShortcut(session: Session): string {
		return `${session.username}(${session.platform}:${session.userId})`
	}

	const logger = ctx.logger('shorturl')

	if (!config.root) { throw new Error('[shorturl] No root url configured.') }
	config.authority = config.authority || 1

	ctx.model.extend('shorturl', {
		id: 'unsigned',
		key: 'string',
		url: 'string',
		count: 'unsigned',
	}, {
		autoInc: true,
	})

	ctx.command('shorturl <url:string>', '短网址生成器', { authority: config.authority })
		.action(async ({ session }, url: string) => {
			if (!url || !url.length || url.length > 1000) { return session.execute('help shorturl') }
			logger.info('shorturl', 'add', userShortcut(session), url)
			const key = await generateKey()
			await ctx.database.create('shorturl', { key, url, count: 0 })
			return segment.quote(session.messageId) + config.root + key
		})
}