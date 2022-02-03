import { Context, Session, Logger, segment } from 'koishi'

interface Forwarding {
	to: string;
	prefix?: string;
}

interface Config {
	[id: string]: Array<Forwarding>,
};

const forwarding: Config = {};
const messageRecord: Array<[string, string, [string, string], [string, string]]> = [];

export const name = 'forward';
export const using = ['database'];
export const logger = new Logger('plugin-forward');

export async function apply(ctx: Context,config:Config) {
	for (const source in config) {
		const targets = config[source];
		forwarding[source] = targets;
		logger.info('forwarding', source, targets);
	}

	ctx.middleware(middleware(ctx));

	ctx.command('.bot.forward', '消息转发帮助', { authority: 3 })
		.option('list', '-l 查看转发列表')
		.option('info', '-i 查看本群 id')
		.action(({ session, options }) => {
			if (!session.channelId) {
				return '请在群聊中使用该指令';
			}

			const id = `${session.platform}:${session.channelId}`;
			const forward = forwarding[id];
			logger.info(id, forward);

			if (options.list) {
				return JSON.stringify(forward);
			} else if (options.info) {
				return id;
			} else {
				return session.execute('help bot.forward');
			}
		});
}


function ignore(chain: segment.Chain) {
	if (chain[0].type === 'quote') {
		chain = chain.slice(1)
	}
	return segment.join(chain).trim().startsWith('//')
}


function middleware(ctx: Context) {
	return function (session: Session, next: () => void) {
		const chain = segment.parse(session.content)
		if (!session.channelId || ignore(chain)) return next();
		const forward = forwarding[`${session.platform}:${session.channelId}`]
		if (!forward) return next();

		forward.forEach(async (target: Forwarding) => {
			const [toPlatform, toChannelId] = target.to.split(':')
			const quote = chain?.[0]
			let start = 0

			// transform quote
			if (quote?.type === 'quote') {
				start++
				const rec = messageRecord.find(([platform1, platform2, [id1], [id2]]) =>
					platform1 === session.platform && platform2 === toPlatform && id1 === quote.data.id ||
					platform1 === toPlatform && platform2 === session.platform && id2 === quote.data.id)
				const data = rec?.[2][0] === quote.data.id ? rec?.[3] : rec?.[2]
				if (!data) return
				chain[0] = {
					type: 'quote',
					data: {
						id: data[0],
						channelId: data[1],
					},
				}
			}

			// transform images
			for (const i in chain) {
				const seg = chain[i]
				if (seg.type !== 'image' || !seg.data.url?.startsWith('http')) continue
				try {
					const data = await ctx.http.get(seg.data.url, {
						responseType: 'arraybuffer'
					})
					const img = Buffer.from(data).toString('base64')
					chain[i] = {
						type: 'image',
						data: {
							url: `base64://${img}`,
						}
					}
				} catch (e) {
					logger.info('error while transforming images', e)
				}
			}

			chain.splice(start, 0, {
				type: 'text',
				data: {
					content: (target.prefix || '') + `${session.username}: `,
				},
			})
			ctx.broadcast([target.to], segment.join(chain)).then(([id]) => {
				messageRecord.push([session.platform, toPlatform, [session.messageId, session.channelId], [id, toChannelId]])
				if (messageRecord.length > 1000) {
					messageRecord.shift()
				}
			})
		})
		logger.debug(`forwarding: ${JSON.stringify(forward)} ${session.content}`)
		return next()
	}
}