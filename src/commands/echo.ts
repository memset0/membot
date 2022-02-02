import { s, Context, Logger } from 'koishi';

export const logger = new Logger('command-send');

export function apply(ctx: Context) {
	ctx.command('echo <message:text>', '复读', { authority: 2 })
		.option('at', '-a [id]')
		.action(({ session, options }, message) => {
			if (options.at) {
				let userId;
				const target = s.parse(options.at)[0];
				if (target.type == 'at') {
					userId = target.data.id;
				} else if (target.type == 'text') {
					userId = target.data.content;
				}
				message = s('at', { id: userId }) + message;
			}

			session.send(message);
		});
}