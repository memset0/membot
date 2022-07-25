import { Context, Logger } from 'koishi'

import ping from './ping'


export const name = 'minecraft'
export const using = []
export const logger = new Logger('minecraft');



export default (ctx: Context) => {
	ctx.command('minecraft', 'Minecraft 相关指令')
		.alias('mc')

	ctx.command('minecraft.ping <url:text>', '查看 MC 服务器信息')
		.alias('mcping')
		.action(async (_, address) => {
			return await ping(address)
		})
}