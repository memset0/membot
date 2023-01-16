import { Bot, Context, Session, segment } from 'koishi'
import { deepCopy } from '../utils/type'

import { Broadcast } from '../templates/broadcast'

export const name = 'feedback'

export interface Config {
	channel: string[]
}


export async function apply(ctx: Context, config: Config) {
	const logger = ctx.logger(name)
	const footer = '\n警告：请不要滥用此功能，否则可能导致账号被机器人禁用。'

	// logger.info('config', config)

	ctx.middleware((session: Session, next) => {
		let isMentioned = false
		for (const element of session.elements) {
			if (element.type === "at" && element.attrs.id == session.bot.selfId) {
				isMentioned = true
				break
			}
		}

		if (isMentioned) {
			let isEmptyMessage = true
			for (const element of session.elements) {
				if (element.type === 'text' && element.attrs.content.trim() !== '') {
					isEmptyMessage = false
				}
			}
			if (isEmptyMessage) {
				return segment('at', { id: session.author.userId }) + `欢迎使用机器人的反馈功能，想说什么话请直接在消息中@本机器人哦` + footer
			}

			const user = session.username ? `${session.username}(${session.author.userId})` : session.author.userId
			const channel = session.channelName ? `${session.channelName}(${session.channelId})` : session.channelId

			let replyCommand = `.bot.sendmsg ${session.channelId} `
			replyCommand += `-q ${session.messageId} -p ${session.platform} `
			if (session.guildId !== 'private') { replyCommand += `-a ${session.author.userId} ` }
			replyCommand += `(message)`

			const elements = deepCopy(session.elements)
			for (const i in session.elements) {
				if (elements[i].type === "at" && elements[i].attrs.id == session.bot.selfId) {
					elements[i] = segment.text('@'+ctx.root.config.nickname)
				}
			}

			const broadcast = new Broadcast({
				type: 'Feedback',
				title: '来自 ' + (session.guildId === 'private' ? `用户 ${user}` : `群聊 ${channel} 的用户 ${user}`),
				elements: elements,
				operation: [
					['封禁', `.bot.ban ${session.author.userId} -p ${session.platform}`],
					['回复', replyCommand],
				],
			})

			for (const channel of config.channel) {
				const platform = channel.split(':', 1)[0]
				const channelId = channel.slice(platform.length + 1)
				for (const bot of session.app.bots) {
					if (bot.platform === platform) {
						// logger.info(platform, channelId, broadcast.toString(platform))
						bot.broadcast([channelId], broadcast.toString(platform))
						break
					}
				}
			}
			return segment('at', { id: session.author.userId }) + `你的反馈已转发给主人，想说什么就继续留言哦。但如果你不文明的话……哼，小心我不理你！` + footer
		}

		return next()
	}, true)
}