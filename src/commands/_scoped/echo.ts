import { segment, Context, Logger } from 'koishi'


export const name = 'echo'
export const logger = new Logger('echo')


export function apply(ctx: Context) {
	ctx.command('echo <message:text>', '复读', { authority: 3 })
		.option('at', '-a [id]')
		.action(({ session, options }, message) => {
			if (options.at) {
				let userId
				const target = segment.parse(options.at)[0]
				if (target.type == 'at') {
					userId = target.data.id
				} else if (target.type == 'text') {
					userId = target.data.content
				}
				message = segment('at', { id: userId }) + message
			}

			if (message == '') {
				return session.execute('help echo')
			}

			session.send(message)
		})
}