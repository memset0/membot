import { segment, Context, Logger } from 'koishi'

const logger = new Logger('bot-sendmsg')

export default function (ctx: Context) {
	ctx.command('bot.sendmsg <userId:string> <guildId:string> <message:text>', '发送消息', { authority: 4 })
		.action(({ session }, userId, guildId, message) => {
			if (userId === '=') { userId = session.userId }
			if (guildId === '=') { guildId = session.guildId }
			if (!userId || !guildId || !message) { return session.execute('help bot.sendmsg') }
			logger.info({ userId, guildId, message })

			if (guildId) {
				if (!parseInt(guildId)) {
					session.bot.sendPrivateMessage(userId, message)
				} else {
					if (userId === '0') {
						session.bot.sendMessage(guildId, message)
					} else {
						session.bot.sendMessage(guildId, segment('at', { id: userId }) + message)
					}
				}
			} else {
				if (message) {
					return segment.unescape(message)
				}
			}
		})
}