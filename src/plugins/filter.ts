import { Context } from 'koishi';

import config from '../config';



export const name = 'filter';
export const using = ['database'];



export async function apply (ctx: Context) {
	ctx.middleware(async (session, next) => {
		/**
		 * 风险控制
		 */
		if (session.platform == 'onebot' && session.type == 'message' && (session.subtype == 'private' || !session.guildId || !session.channelId)) {
			// 由于腾讯方面的限制，onebot 平台发送的私聊回话消息应拒绝回复，否则容易导致机器人冻结。
			return;
		}

		const user = await ctx.database.getUser(session.platform, session.author.userId);
		const authority = user && Object.keys(user).includes('authority') ? user.authority : 1;

		/** 
		 * 用户封禁
		 */
		if (authority === 0) {
			// 说明用户已被封禁
			let flagAlert = false;
			if (session.type == 'message' && session.subtype == 'group') {
				if (config.options.prefix.includes(session.content[0])) {
					flagAlert = true;
				}
			}
			if (flagAlert) {
				return '你已被封禁，无法调用指令，更多信息请联系机器人作者。'
			}
			return;
		}

		/** 
		 * 指令临时禁用
		 */
		if (config.options.prefix.includes(session.content[0])) {
			const content = session.content.slice(1);
			if (!(config.master[session.platform] && config.master[session.platform] == session.author.userId)) {
				if (content.startsWith('recall') || content.startsWith('usage') || content.startsWith('timer')) {
					return '该指令被暂时禁用。';
				}
			}
		}

		return next();
	}, true /* 表示前置中间件 */);
};