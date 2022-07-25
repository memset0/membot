import { segment, Context, Logger } from 'koishi'

const logger = new Logger('bot-sendmsg')

export default function (ctx: Context) {
	ctx.command('bot.sendmsg <channelId:string> <message:text>', '发送消息', { authority: 4 })
		.option('at', '-a <string>')
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

			// logger.info('broadcast', channelId, message)
			await ctx.broadcast([`${platform}:${channelId}`], message)
		})
}