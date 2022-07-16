import { segment, Context, Logger } from 'koishi';
import config from '../config';

declare module 'koishi' {
	interface User {
		authority: number,
	}
}


export const name = 'auth';
export const using = ['database'];

export const logger = new Logger('plugin-auth');


export function parseUserId(id) {
	const target = segment.parse(id)[0];
	if (target.type == 'at') {
		return target.data.id;
	} else if (target.type == 'text') {
		return target.data.content;
	}
}

export async function apply(ctx: Context) {
	const db = ctx.database;

	ctx.model.extend('user', {
		authority: { type: 'integer', initial: 1 },
	})

	for (const masterPlatform in config.master) {
		const masterId = config.master[masterPlatform];
		await db.setUser(masterPlatform, masterId, { authority: 4 })
		logger.info('root', masterPlatform, masterId, JSON.stringify(await db.getUser(masterPlatform, masterId)));
	}

	ctx.command('auth', '用户权限');

	ctx.command('auth.show <id>', '查看用户权限')
		.userFields(['authority'])
		.action(async ({ session }, id) => {
			if (!id) {
				return `你的权限为${session.user.authority}级`;
			}
			if (session.user.authority < 3) {
				return '你的没有查看其他用户权限等级的权限';
			}

			const platform = session.platform;
			const userId = parseUserId(id);
			const user = await db.getUser(platform, userId);

			const authority = user && Object.keys(user).includes('authority') ? user.authority : 1;
			return `用户${segment('at', { id: userId })}的权限为${authority}级`;
		});

	ctx.command('auth.ban <id>', '封禁用户', { authority: 4 })
		.userFields(['authority'])
		.action(async ({ session }, id) => {
			if (session.user.authority < 4) {
				return '你没有封禁用户的权限';
			}

			return session.execute('auth.give 0 ' + id);
		});

	ctx.command('auth.give <level> <id>', '用户授权', { authority: 4 })
		.userFields(['authority'])
		.before(({ session }, ...args) => {
			if (args.length < 2) return session.execute('auth.give --help');
		})
		.action(async ({ session }, levelText, id) => {
			const level = parseInt(levelText);
			if (isNaN(level) || level >= 5 || level < 0) { return '无效的用户权限'; }

			const platform = session.platform;
			const userId = parseUserId(id);
			const user = await db.getUser(platform, userId);
			if (!user) { return '无效的目标用户'; }

			const selfAuthority = session.user.authority;
			const targetAuthority = Object.keys(user).includes('authority') ? user.authority : 1;

			if (session.userId == user[platform]) { return '不能给自己授权'; }
			if (userId == session.selfId) { return `不能给${config.nickname}自己授权`; }
			if (level >= selfAuthority) { return '你只能授予比自己低的权限等级'; }
			if (targetAuthority === 0 && selfAuthority < 4) { return '你没有解封用户的权限'; }

			await db.setUser(platform, userId, { authority: level });
			return `已授予${segment('at', { id: userId })}${level}级权限`;
		})
}