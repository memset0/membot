import { Context } from 'koishi'

import applySendmsg from './sendmsg'

export const name = 'bot'

export function apply(ctx: Context) {
	ctx.command('bot', '机器人管理指令', { authority: 4 })

	ctx.command('bot.ban <id>', '封禁用户', { authority: 4 })
		.action(async ({ session }, id) => {
			return session.execute('auth.give 0 ' + id)
		})

	ctx.command('bot.unban <id>', '解封用户', { authority: 4 })
		.action(async ({ session }, id) => {
			return session.execute('auth.give 1 ' + id)
		})

	applySendmsg(ctx)
}