import { Context, Session, Logger, segment } from 'koishi'

import '../../utils/date'
import { sliceWithEllipsis } from '../../utils/string'
import { QFace, getUserName } from '../../utils/onebot'

import { ForwardTarget, MessageRecord, Type2Text } from './types'
import adaptPlatformKook from './platform/kook'
import adaptPlatformTelegram from './platform/telegram'


export interface Config {
	[id: string]: Array<ForwardTarget>
}

const forwardingList: Config = {}
const messageRecord: Array<MessageRecord> = []


export const name = 'forward'

export async function apply(ctx: Context, config: Config) {
	const logger = ctx.logger(name)

	for (const source in config) {
		const targets = config[source]
		forwardingList[source] = targets
		for (const e of forwardingList[source]) {
			if (e.to) {
				if (!e.platform) e.platform = e.to.split(':')[0]
				if (!e.channelId) e.channelId = e.to.split(':')[1]
			} else if (e.platform && e.channelId) {
				e.to = `${e.platform}:${e.channelId}`
			}
			if (!e.template) { e.template = `${e.prefix || ''} <userName>: ` }
			if (!e.to || !e.platform || !e.channelId) { logger.warn('Missing target channel config.') }

			e.cache = {
				use: false,
				limit: 1000,
				...(e.cache || {}),
			}

			e.options = {
				usePrefix: !(e.options?.useCard && e.platform === 'kaiheila'),
				transformBase64: !(e.platform === 'kaiheila'),
				type2text: Type2Text,
				// boldedPrefix: e.platform === 'telegram',
				...(e.options || {}),
			}
		}
	}

	ctx.command('bot.forward', '消息转发帮助', { authority: 3 })
		.option('list', '-l 查看转发列表')
		.option('info', '-i 查看本群 id')
		.action(({ session, options }) => {
			if (!session.channelId) {
				return '请在群聊中使用该指令'
			}

			const id = `${session.platform}:${session.channelId}`
			const forward = forwardingList[id]
			// logger.info(id, forward)

			if (options.list) {
				return JSON.stringify(forward)
			} else if (options.info) {
				return id
			} else {
				return session.execute('help bot.forward')
			}
		})

	ctx.middleware(middleware(ctx))
}


function middleware(ctx: Context) {
	const logger = ctx.logger(name)

	function ignore(chain: segment.Chain) {
		if (chain?.[0]?.type === 'quote') {
			chain = chain.slice(1)
		}
		if (chain?.[0]?.type === 'at') {
			chain = chain.slice(1)
			if (chain?.[0]?.type === 'text' && chain[0].data?.content?.startsWith(' ')) {
				chain[0].data.content = chain[0].data.content.slice(1)
			}
		}
		return segment.join(chain).trim().startsWith('//')
	}

	return function (session: Session, next: () => void) {
		if (!session.channelId || session.author.userId === session.bot.selfId) { return next() }
		if (!Object.keys(forwardingList).includes(`${session.platform}:${session.channelId}`)) { return next() }

		// logger.info('receive', session.platform, logBeautifyChain(segment.parse(session.content)))

		forwardingList[`${session.platform}:${session.channelId}`]
			.forEach(async (target: ForwardTarget) => {
				const chain = segment.parse(session.content)
				if (ignore(chain)) { return next() }
				let start = 0

				if (chain?.[0]?.type === 'quote') {
					let flag = false

					if (target.cache.use) {
						const rec = messageRecord.find(r =>
							r[0] === session.platform && r[1] === target.platform && r[2][0] === chain[0].data.id ||
							r[0] === target.platform && r[1] === session.platform && r[3][0] === chain[0].data.id)
						const data = rec?.[2][0] === chain[0].data.id ? rec?.[3] : rec?.[2]
						if (data) {
							const author = rec?.[4]
							const shortcut = rec?.[5]
							flag = true
							if (target.platform === 'onebot') {
								start++
								chain[0] = {
									type: 'quote',
									data: { id: data[0], channelId: data[1] },
								}
							} else {
								chain[0] = {
									type: 'text',
									data: { content: `[回复 ${author[1]}: ${shortcut}] ` },
								}
							}
							if (chain?.[1]?.type === 'at' && chain?.[1]?.data?.id === author[0]) {
								if (chain?.[2]?.type == 'text' && chain?.[2]?.data?.content?.[0] === ' ') {
									chain[2].data.content = chain[2].data.content.slice(1)
								}
								chain.splice(1, 1)
							}
						}
					}

					if (!flag) {
						chain[0] = {
							type: 'text',
							data: { content: '[回复消息] ' },
						}
					}
				}

				for (const i in chain) {
					const seg = chain[i]

					switch (seg.type) {
						case 'text': {
							break
						}

						case 'at': {
							if (target.platform !== session.platform) {
								const name = seg.data.name || (await getUserName(session.platform, seg.data.id, { guildId: session.guildId, session })) || seg.data.id
								chain[i] = {
									type: 'text',
									data: { content: `@${name}` }
								}
							}
							break
						}

						case 'face': {
							if (target.platform !== session.platform) {
								chain[i] = {
									type: 'text',
									data: { content: `[${QFace.idToText(seg.data.id)}]` }
								}
							}
							break
						}

						case 'image': {
							if (target.options.transformBase64 && seg.data.url?.startsWith('http')) {
								try {
									const data = await ctx.http.get(seg.data.url, { responseType: 'arraybuffer' })
									const img = Buffer.from(data).toString('base64')
									chain[i] = {
										type: 'image',
										data: { url: `base64://${img}` }
									}
								} catch (e) {
									logger.info(`error while transforming ${seg.type}s`, e)
								}
							}
							break
						}

						case 'json': {
							if (target.platform !== session.platform) {
								chain[i] = { type: 'text', data: { content: '' } }
							}
							break
						}

						default: {
							if (Object.keys(Type2Text).includes(seg.type)) {
								chain[i] = { type: 'text', data: { content: target.options.type2text[seg.type] } }
							} else {
								chain[i] = { type: 'text', data: { content: target.options.type2text['*unknown'] } }
							}
							break
						}
					}
				}

				let shortcut: string[] = []
				for (const seg of chain) {
					if (seg.type === 'quote') {
						continue
					} else if (seg.type === 'text') {
						shortcut.push(segment.join([seg]).trim())
					} else {
						shortcut.push(`[${seg.type}]`)
					}
				}

				if (target.options.usePrefix) {
					chain.splice(start, 0, {
						type: 'text',
						data: {
							content: target.template
								.replace(/\\n/g, '\n')
								.replace(/<userId>/g, session.author.userId)
								.replace(/<userName>/g, session.author.nickname || session.author.username)
						},
					})

					if (target.options.boldedPrefix) {
						chain[start].data.content = chain[start].data.content
							.split('\n')
							.map(s => ('**' + s + '**'))
							.join('\n')
					}
				}

				let messages = null
				switch (target.platform) {
					case "kaiheila": {
						messages = adaptPlatformKook(chain, ctx, session, target)
						break
					}
					case "telegram": {
						messages = adaptPlatformTelegram(chain, ctx, session, target, start)
						break
					}
					default: {
						messages = [segment.join(chain)]
					}
				}

				for (const message of messages) {
					await ctx.broadcast([target.to], message)
						.then(([id]) => {
							if (target.cache.use) {
								messageRecord.push([
									session.platform,
									target.platform,
									[session.messageId, session.channelId],
									[id, target.channelId],
									[session.author.userId, session.author.nickname || session.author.username],
									sliceWithEllipsis(shortcut.join(' '), 15),
								])
							}
							if (messageRecord.length > 1000) {
								messageRecord.shift()
							}
						})
				}
			})

		return next()
	}
}


function logBeautifyChain(node: any) {
	if (typeof node === 'object') {
		const res = {}
		for (const i in node) {
			res[i] = logBeautifyChain(node[i])
		}
		return res
	} else {
		if (typeof node === 'string') { return node.slice(0, 30) }
		return node
	}
}