import { Context } from 'koishi';

import applySendmsg from './sendmsg';

export const name = 'bot';

export function apply(ctx: Context) {
	ctx.command('bot', '机器人管理指令', { authority: 4 });

	applySendmsg(ctx);
}