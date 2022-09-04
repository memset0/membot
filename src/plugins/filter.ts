import { Context, Logger } from 'koishi'


export const name = 'filter'
export const using = ['database']


export async function apply(ctx: Context) {
	const logger = ctx.logger('filter')

	const prefixes = (typeof ctx.options.prefix === 'string' ? [ctx.options.prefix] : ctx.options.prefix) as string[]

	ctx.middleware(async (session, next) => {
		/**
		 * 风险控制
		 */
		if (session.platform === 'onebot' && session.type === 'message' && (session.subtype === 'private' || !session.channelId)) {
			const user = await ctx.database.getUser(session.platform, session.author.userId)
			const authority = user?.authority ? user.authority : 1
			if (authority <= 1) {
				// 由于腾讯方面的限制，onebot 平台发送的私聊回话消息应拒绝回复，否则容易导致机器人冻结。
				return
			}
		}
		if (session.platform === 'telegram' && session.author?.isBot) {
			// 不处理其他 Telegram Bot 发送的消息，虽然本来就收不到（x）
			return
		}

		const user = await ctx.database.getUser(session.platform, session.author.userId)
		const authority = user && Object.keys(user).includes('authority') ? user.authority : 1

		/** 
		 * 用户封禁
		 */
		if (authority === 0) {
			// 说明用户已被封禁
			let flagAlert = false
			if (session.type == 'message' && session.subtype == 'group') {
				if (prefixes.includes(session.content[0])) {
					flagAlert = true
				}
			}
			if (flagAlert) {
				return '非常抱歉，你已被禁止使用机器人'
			}
			return
		}

		return next()
	}, true /* 表示前置中间件 */)
}