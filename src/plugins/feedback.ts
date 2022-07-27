import { Bot, Context, Session, segment } from 'koishi'

export const name = 'feedback'

export interface Config {
	master: {
		platform: string
		userId: string
	}
}


export async function apply(ctx: Context, config: Config) {
	// onebot 平台下机器人被 @ 时自动转发给主人の账号
	let bot: null | Bot = null
	for (const currentBot of ctx.bots) {
		if (currentBot.platform == config.master.platform) {
			bot = currentBot
			break
		}
	}
	const footer = '\n警告：请不要滥用此功能，否则可能导致账号被机器人封禁。'

	ctx.middleware((session: Session, next) => {
		const keyString = segment('at', { id: session.bot.selfId })

		if (session.content.indexOf(keyString) !== -1 && !session.content.startsWith('[CQ:quote,id=')) {
			let content = session.content
			if (content.replace(keyString, '').replace(/\s/g, '') == '') {
				return segment('at', { id: session.author.userId }) + `欢迎使用机器人的反馈功能，想说什么话请直接在消息中@本机器人哦` + footer
			}

			const user = session.username ? `${session.username}(${session.author.userId})` : session.author.userId
			const channel = session.channelName ? `${session.channelName}(${session.channelId})` : session.channelId
			const from = session.guildId === 'private' ? `用户 ${user}` : `群聊 ${channel} 的用户 ${user}`

			content = `[Feedback] 来自 ${from}\n${content.replace(keyString, '@' + ctx.options.nickname).trim()}\n`
			content += `封禁：.bot.ban ${session.author.userId}\n`
			content += session.guildId === 'private' ?
				`回复：.bot.sendmsg ${session.channelId} -q ${session.messageId} (message)` :
				`回复：.bot.sendmsg ${session.channelId} -a ${session.author.userId} -q ${session.messageId} (message)`

			bot.sendPrivateMessage(config.master.userId, content)
			return segment('at', { id: session.author.userId }) + `你的反馈已转发给主人，想说什么就继续留言哦。但如果你不文明的话……哼，小心我不理你！` + footer
		}

		return next()
	}, true)
}