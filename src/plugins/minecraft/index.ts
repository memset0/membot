import { Context } from 'koishi-core';

import ping from './ping';

export default (ctx: Context) => {
	ctx.command('minecraft', 'Minecraft 相关指令')
		.alias('mc')

	ctx.command('minecraft.ping <url>', '查看 Minecraft 服务器信息')
		.action(async ({ session }, address) => {
			console.log('[command] minecraft.ping', address);
			ping(session, String(address));
		});
}