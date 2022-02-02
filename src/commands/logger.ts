import { User, Context, Session } from 'koishi';

export default (ctx: Context) => {
	ctx.command('logger', '调试工具', { authority: 3 });

	ctx.command('logger.session', '输出 session 信息', { authority: 3 })
		.action(({ session }) => {
			return JSON.stringify(session, null, 2);
		});

	ctx.command('logger.userdata <userId>', '输出 user 数据', { authority: 3 })
		.action(({ session }, userId) => {
			let currentPlatform = session.platform;
			let currentUserID = userId || session.userId;
			let currentUser = ctx.database.getUser(currentPlatform, currentUserID);

			return JSON.stringify(currentUser, null, 2);
		});
};