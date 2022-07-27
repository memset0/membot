import { Context, Logger } from 'koishi'

import * as commandPing from './ping'

export const name = 'minecraft'

export function apply(ctx: Context) {
	const logger = new Logger(name)

	ctx.command('minecraft', 'Minecraft 相关指令')
		.alias('mc')

	ctx.plugin(commandPing)
}