import { Context, segment } from 'koishi'

import '../../utils/date'


export const name = 'bot-status'

export function apply(ctx: Context) {
	const logger = ctx.logger(name)

	ctx.command('bot.status', '机器人运行状态', { authority: 3 })
		.action(({ session }) => {
			const result = []
			const date = new Date()
			result.push(['系统时间', date.toChineseString()])

			for (const bot of ctx.app.bots) {
				result.push([
					`${bot.platform}:${bot.selfId}`,
					`status: ${bot.status}`
				])
			}

			let output = '机器人运行状态\n'
			for (const col of result) {
				if (session.platform === 'telegram') {
					output += `<strong>[${col[0]}]</strong> ${col[1]}\n`
				} else {
					output += `【${col[0]}】${col[1]}\n`
				}
			}
			if (session.platform === 'telegram') {
				output = segment('html') + output
			}
			logger.info('output', [output])
			return output.replace(/\s+$/, '')
		})
}