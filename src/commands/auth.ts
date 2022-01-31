import { s, Context, Logger } from 'koishi';
import config from '../config';

export default async (ctx: Context) => {
	const db = ctx.database;
	const logger = new Logger('plugin-auth');
	logger.info(ctx.database);

	for (const masterPlatform in config.master) {
		const masterId = config.master[masterPlatform];
		logger.info('give root authority', { platform: masterPlatform, userId: masterId });
		db.setUser(masterPlatform, masterId, { authority: 4 })
			.then(async () => {
				// async callback
				logger.info(masterPlatform, masterId, await db.getUser(masterPlatform, masterId));
			});
	}

	ctx.command('auth', '用户权限');

	ctx.command('auth.show', '查看我的权限')
		// .userFields(['authority'])
		.action(({ session }) => `你的权限为${session.user['authority']}级`);

	ctx.command('auth.give <level> <id>', '用户授权', { authority: 4 })
		// .userFields(['authority'])
		.before(({ session }, ...args) => {
			if (args.length < 2) return session.execute('auth.give --help');
		})
		.action(async ({ session }, levelText, id) => {
			const level = parseInt(levelText);
			if (isNaN(level) || level >= 5 || level < 0) return '无效的用户权限';
			if (level >= session.user['authority']) return '只能授予比自己低的权限';

			const target = s.parse(id)[0];
			const platform = session.platform;
			let user;
			if (target.type == 'at') {
				id = target.data.id;
				user = await db.getUser(platform, id);
			} else if (target.type == 'text') {
				id = target.data.content;
				user = await db.getUser(platform, id);
			}

			if (id == session.selfId) {
				return `不能给${config.nickname}自己授权`;
			} else if (!user) {
				return '用户信息不正确';
			} else if (session.userId == user[platform]) {
				return '不能给自己授权';
			} else {
				await db.setUser(platform, id, { authority: level });
				return `已授予${s('at', { id: id })} ${level}级权限。`;
			}
		})
}