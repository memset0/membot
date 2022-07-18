import { Context } from 'koishi';

import config from '../config';



export const name = 'filter';
export const using = ['database'];



export async function apply (ctx: Context) {
	ctx.middleware(async (session, next) => {
		// 风险控制
		if (session.platform == 'onebot' && session.type == 'message' && (session.subtype == 'private' || !session.guildId || !session.channelId)) {
			// 由于腾讯方面的限制，onebot 平台发送的私聊回话消息应拒绝回复，否则容易导致机器人冻结。
			return;
		}

		const user = await ctx.database.getUser(session.platform, session.author.userId);
		const authority = Object.keys(user).includes('authority') ? user.authority : 1;

		if (authority === 0) {
			// 说明用户已被封禁
			let flagAlert = false;
			if (session.type == 'message' && session.subtype == 'group') {
				if (config.options.prefix.includes(session.content[0])) {
					flagAlert = true;
				}
			}
			if (flagAlert) {
				return '该用户已被封禁，更多信息请联系机器人作者。'
			}
			return;
		}

		return next();
	}, true /* 表示前置中间件 */);
};