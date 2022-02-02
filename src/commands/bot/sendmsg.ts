import { s, Context, Logger } from 'koishi';

export function apply(ctx: Context) {
	const logger = new Logger('command-bot-sendmsg');

	ctx.command('bot.sendmsg <userId:string> <guildId:string> <message:text>', '发送消息', { authority: 4 })
		.action(({ session }, userId, guildId, message) => {
			if (userId === '=') {
				userId = session.userId;
			}
			if (guildId === '=') {
				guildId = session.guildId;
			}
			logger.info({ userId, guildId, message });

			if (guildId) {
				if (!parseInt(guildId)) {
					session.bot.sendPrivateMessage(userId, message);
				} else {
					if (userId === '0') {
						session.bot.sendMessage(guildId, message);
					} else {
						session.bot.sendMessage(guildId, s('at', { id: userId }) + message);
					}
				}
			} else {
				if (message) {
					return s.unescape(message);
				}
			}
		});
}