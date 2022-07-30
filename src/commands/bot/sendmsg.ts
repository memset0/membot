import { segment, Context } from 'koishi'

export const name = 'bot-sendmsg'

export function apply(ctx: Context) {
	const logger = ctx.logger(name)

	ctx.command('bot.sendmsg <channelId:string> <message:text>', '发送消息', { authority: 4 })
		.option('at', '-a <string>')
		.option('quote', '-q <string>')
		.option('platform', '-p <string>')
		.action(async ({ session, options }, channelId, message) => {
			if (!channelId || !message) { return session.execute('help bot.sendmsg') }
			if (channelId === '.') { channelId = session.channelId }

			const platform = options.platform || session.platform
			// logger.info({ channelId, message, platform, options })

			if (options.at) {
				let userId = null
				const target = segment.parse(options.at)[0]
				if (target.type == 'at') {
					userId = target.data?.id
				} else if (target.type == 'text') {
					userId = target.data?.content
				}
				if (userId) {
					message = segment('at', { id: userId }) + message
				}
			}

			if (options.quote) {
				message = segment('quote', { id: options.quote as string, channelId: session.channelId }) + message
			}

			// logger.info('broadcast', channelId, message)
			await ctx.broadcast([`${platform}:${channelId}`], message)
		})
}