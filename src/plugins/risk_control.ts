import { Context } from 'koishi';

export default (ctx: Context) => {
	// 风险控制模块

	ctx.middleware((session, next) => {
		if (session.platform == 'onebot' && session.type == 'message' &&
			(session.subtype == 'private' || !session.guildId || !session.channelId)) {
			// qq 平台发送的私聊回话消息等应拒绝回复。
		} else {
			return next();
		}
	}, true /* 表示前置中间件 */);
};