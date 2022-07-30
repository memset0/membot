import { Context, Session, Logger, segment } from 'koishi'

import { sliceWithEllipsis } from '../../utils/string'
import { QFace, getUserName } from '../../utils/onebot'
import { BufferConverter } from '../../utils/file-type'

import adaptPlatformKook from './platform/kook'
import adaptPlatformTelegram from './platform/telegram'
import { templateArgvFactory } from './template'
import { ForwardTarget, MessageRecord, Type2Text, MessageRecordMeta } from './types'


export interface Config {
	[id: string]: Array<ForwardTarget>
}

const forwardingList: Config = {}
const revForwardingList: Config = {}
const messageRecord: Array<MessageRecord> = []


export const name = 'forward'

export async function apply(ctx: Context, config: Config) {
	const logger = ctx.logger(name)

	for (const source in config) {
		const s = {
			platform: source.split(':')[0],
			channelId: source.split(':')[0],
		}
		forwardingList[source] = config[source]
		for (const e of forwardingList[source]) {
			if (e.to) {
				if (!e.platform) e.platform = e.to.split(':')[0]
				if (!e.channelId) e.channelId = e.to.split(':')[1]
			} else if (e.platform && e.channelId) {
				e.to = `${e.platform}:${e.channelId}`
			}
			if (!e.template) { e.template = `${e.prefix || ''} {userNick}: ` }
			if (!e.to || !e.platform || !e.channelId) { throw new Error('[plugin-forward] Missing target channel config.') }

			e.cache = {
				use: false,
				limit: 1000,
				...(e.cache || {}),
			}

			e.options = {
				sendGif: e.platform !== 'telegram',
				usePrefix: !(e.options?.useCard && e.platform === 'kaiheila'),
				transformBase64: !(e.platform === 'kaiheila'),
				type2text: Type2Text,
				...(e.options || {}),
			}
		}
	}

	for (const source in forwardingList) {
		for (const e of forwardingList[source]) {
			const target = e.to
			const copied = JSON.parse(JSON.stringify(e))
			copied.to = source
			copied.platform = source.split(':')[0]
			copied.channelId = source.split(':')[1]

			if (!Object.keys(revForwardingList).includes(target)) {
				revForwardingList[target] = []
			}
			revForwardingList[target].push(copied)
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
	// ctx.on('message-updated', onMessageUpdated)
	ctx.on('message-deleted', onMessageDeleted)
}


function findMessage(messageId: string | undefined, sessionPlatform: string, targetPlatform: string, reverse: boolean = false): MessageRecordMeta | null {
	for (const record of messageRecord) {
		if (record[0] === sessionPlatform && record[1] === targetPlatform && record[2][0] === messageId) {
			return {
				messageId: record[3][0],
				channelId: record[3][1],
				platform: record[1],
				author: {
					userId: record[4][0],
					username: record[4][1],
				},
				shortcut: record[5],
			} as MessageRecordMeta
		}
	}
	if (!reverse) { return null }
	for (const record of messageRecord) {
		if (record[1] === sessionPlatform && record[0] === targetPlatform && record[3][0] === messageId) {
			return {
				messageId: record[2][0],
				channelId: record[2][1],
				platform: record[0],
				author: {
					userId: record[4][0],
					username: record[4][1],
				},
				shortcut: record[5],
			} as MessageRecordMeta
		}
	}
	return null
}


function onMessageDeleted(session: Session) {
	if (!session.channelId) { return }
	if (!Object.keys(forwardingList).includes(`${session.platform}:${session.channelId}`)) { return }

	// const logger = session.app.logger(name + '(msgdel)')
	// logger.info(session)

	forwardingList[`${session.platform}:${session.channelId}`]
		.forEach(async (target: ForwardTarget) => {
			const record = target.cache.use && findMessage(session.messageId, session.platform, target.platform, target.options.reverseHook)
			if (!record) { return }

			for (const bot of session.app.bots) {
				if (bot.platform === record.platform) {
					// console.log(record)
					bot.deleteMessage(record.channelId, record.messageId)
				}
			}
		})
}


function middleware(ctx: Context) {
	const templateArgv = templateArgvFactory(ctx)
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
					const record = target.cache.use && findMessage(chain[0].data?.id, session.platform, target.platform, true)
					if (record) {
						if (target.platform === 'onebot' || target.platform === 'telegram') {
							start++
							chain[0] = {
								type: 'quote',
								data: {
									id: record.messageId,
									channelId: record.channelId
								},
							}
							if (chain?.[1]?.type === 'at' && chain?.[1]?.data?.id === record.author.userId) {
								if (chain?.[2]?.type == 'text' && chain?.[2]?.data?.content?.[0] === ' ') {
									chain[2].data.content = chain[2].data.content.slice(1)
								}
								chain.splice(1, 1)
							}
						} else {
							chain[0] = {
								type: 'text',
								data: {
									content: `[回复 ${record.author.username}: ${record.shortcut}] `
								},
							}
						}
					} else {
						chain[0] = {
							type: 'text',
							data: { content: '[回复消息] ' },
						}
					}
				}

				for (const i in chain) {
					const seg = chain[i]

					switch (seg.type) {
						case 'quote':
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
								break;
							}

							if (target.platform !== session.platform && session.platform === 'telegram') {
								if (seg.data.url?.startsWith('base64://UklGR')) {
									// mime webp  <=>  static stickers
									const buffer = Buffer.from(seg.data.url.slice(9), 'base64')
									seg.data.url = 'base64://' + (await BufferConverter.webp2jpg(buffer)).toString('base64')
								} else if (seg.data.url?.startsWith('base64://GkXfo')) {
									// mime webm  <=>  animated stickers
									const buffer = Buffer.from(seg.data.url.slice(9), 'base64')
									seg.data.url = 'base64://' + (await BufferConverter.webm2gif(buffer)).toString('base64')
								} else if (seg.data.url?.startsWith('base64://AAAA')) {
									// mime mp4  <=>  video, though Telegram call this 'gif'
									const buffer = Buffer.from(seg.data.url.slice(9), 'base64')
									seg.data.url = 'base64://' + (await BufferConverter.mp42gif(buffer)).toString('base64')
								}
								break
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

				if (!target.options.sendGif) {
					// this is a temporary fallback
					for (const i in chain) {
						if (chain[i].type === 'image') {
							if (chain[i].data.url.startsWith('base64://R0lGOD')) {
								// mime gif
								const buffer = Buffer.from(chain[i].data.url.slice(9), 'base64')
								chain[i].data.url = 'base64://' + (await BufferConverter.gif2jpg(buffer)).toString('base64')
							}
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

				if (target.options.useHTML) {
					start++
					chain.unshift({ type: 'html', data: {} })
				}

				if (target.options.useMarkdown) {
					start++
					chain.unshift({ type: 'markdown', data: {} })
				}

				if (target.options.usePrefix) {
					let content = target.template.replace(/\\n/g, '\n')
					for (const argv in templateArgv) {
						if (content.match(argv)) {
							content = content.replace(new RegExp(argv, 'g'), templateArgv[argv](session))
						}
					}
					chain.splice(start, 0, { type: 'text', data: { content: content } })
				}

				let messages = null
				switch (target.platform) {
					case "kaiheila": {
						messages = await adaptPlatformKook(chain, ctx, session, target)
						break
					}
					case "telegram": {
						messages = await adaptPlatformTelegram(chain, ctx, session, target, start)
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
			if (i !== 'capture') {
				res[i] = logBeautifyChain(node[i])
			}
		}
		return res
	} else {
		if (typeof node === 'string') { return node.slice(0, 30) }
		return node
	}
}