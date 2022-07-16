import { segment, Context, Logger } from 'koishi';

declare module 'koishi' {
	interface User {
		authority: number,
	}
}


export const name = 'echo';
export const logger = new Logger('command-send');

export function apply(ctx: Context) {
	ctx.command('echo <message:text>', '复读', { authority: 2 })
		.userFields(['authority'])
		.option('at', '-a [id]')
		.action(({ session, options }, message) => {
			if (session.user.authority < 2) {
				return '你没有使用此命令的权限';
			}

			if (options.at) {
				let userId;
				const target = segment.parse(options.at)[0];
				if (target.type == 'at') {
					userId = target.data.id;
				} else if (target.type == 'text') {
					userId = target.data.content;
				}
				message = segment('at', { id: userId }) + message;
			}

			session.send(message);
		});
}