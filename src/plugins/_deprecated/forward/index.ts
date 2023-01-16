import { Bot, Context, Logger, Session, segment } from 'koishi'

import { sliceWithEllipsis } from '../../utils/string'
import { QFace, getUserName } from '../../utils/onebot'
import { BufferConverter } from '../../utils/file-type'

import adaptKook from './adapter/kook'
import adaptTelegram from './adapter/telegram'
import { templateArgvFactory } from './template'
import { ForwardTarget, SpecialMessage, MessageRecord, Type2Text, MessageRecordMeta } from './types'


export interface Config {
	[id: string]: Array<ForwardTarget>
}

const forwardingList: Config = {}
const revForwardingList: Config = {}
const messageRecord: Array<MessageRecord> = []


export const name = 'forward' as const
export const logger = new Logger(name)

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
				usePrefix: !(e.options?.useCard && e.platform === 'kook'),
				transformBase64: !(e.platform === 'kook'),
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


async function deleteMessage(bots: Bot[], platform: string, channelId: string, messageId: string) {
	let success = false
	for (const bot of bots) {
		if (bot.platform === platform) {
			try {
				await bot.deleteMessage(channelId, messageId)
				success = true
			} catch (error) {
				continue
			}
		}
	}
	if (!success) {
		logger.warn('deleteMessage failed', platform, channelId, messageId)
	}
}

function findMessage(messageId: string, channelId: string, platform: string): Partial<MessageRecordMeta> | null {
	for (let shift = 0; shift < 2; shift++) {
		for (const record of messageRecord) {
			if (record[shift] === platform && record[2 + shift][0] === messageId && record[2 + shift][1] === channelId) {
				return {
					author: {
						userId: record[4][0],
						username: record[4][1],
					},
					shortcut: record[5],
				} as Partial<MessageRecordMeta>
			}
		}
	}
}

function findForwardedMessage(messageId: string | undefined, sessionPlatform: string, targetPlatform: string, reverse: boolean = false): MessageRecordMeta | null {
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
			const record = target.cache.use && findForwardedMessage(session.messageId, session.platform, target.platform, target.options.reverseHook)
			if (!record) { return }

			return deleteMessage(session.app.bots, record.platform, record.channelId, record.messageId)
		})
}


function middleware(ctx: Context) {
	const templateArgv = templateArgvFactory(ctx)
	const logger = ctx.logger(name)

	function filterOutEmpty(chain: any[], start: number = -1) {
		if (~start) {
			while (start < chain.length && chain[start].type === 'text' && !chain[start].data.content) { chain.splice(start, 1) }
		} else {
			for (let i = 0; i < chain.length; i++) {
				if (chain[i].type === 'text' && !chain[i].data.content) {
					chain.splice(i, 1)
					i -= 1
				}
			}
		}
	}

	function getMessageType(chain: segment.Chain): SpecialMessage {
		let start = 0
		while (start < chain.length && !(chain[start].type === 'text' && chain[start].data.content?.trim())) { start++ }
		if (start >= chain.length) { return SpecialMessage.NORMAL }

		const plain = segment.join(chain.slice(start)).trim()
		if (plain.startsWith('//')) { return SpecialMessage.IGNORE }
		if (chain?.[0]?.type === 'quote' && plain.startsWith('!!')) { return SpecialMessage.RECALL }
		return SpecialMessage.NORMAL
	}

	return async function (session: Session, next: () => void) {
		if (!session.channelId || session.author.userId === session.bot.selfId) { return next() }
		if (!Object.keys(forwardingList).includes(`${session.platform}:${session.channelId}`)) { return next() }
		// logger.info('receive', `${session.platform}:${session.channelId}`, [loggerToText(session.content)])

		const chain = segment.parse(session.content)
		const type = getMessageType(chain)
		if (type === SpecialMessage.IGNORE) { return next() }
		if (type === SpecialMessage.RECALL) {
			logger.info('RECALL', session.channelId, session.messageId, chain[0].data.id)
			if (session.platform === 'telegram') {
				// function findForwardedMessage(messageId: string | undefined, sessionPlatform: string, targetPlatform: string, reverse: boolean = false): MessageRecordMeta | null {
				const deletedRecord = findMessage(chain[0].data.id, session.channelId, session.platform)
				if (!deletedRecord) {
					logger.warn('RECALL', session.channelId, session.messageId, chain[0].data.id, '撤回失败，无法找到该消息')
					return next()
				}
				if (deletedRecord.author.userId !== session.author.userId) {
					logger.warn('RECALL', session.channelId, deletedRecord.author.userId, session.author.userId, '撤回失败，消息只能由发送者本人撤回')
					await session.bot.sendMessage(session.channelId, '撤回失败，消息只能由发送者本人撤回')
					return next()
				}
				logger.info('RECALL', deletedRecord)
				const deletedSession = session.bot.session()
				deletedSession.platform = session.platform
				deletedSession.channelId = session.channelId
				deletedSession.messageId = chain[0].data.id
				deletedSession.author = deletedRecord.author
				deleteMessage(session.app.bots, 'telegram', session.channelId, chain[0].data.id)
				deleteMessage(session.app.bots, 'telegram', session.channelId, session.messageId)
				await onMessageDeleted(deletedSession)
				return
			}
		}

		forwardingList[`${session.platform}:${session.channelId}`]
			.forEach(async (target: ForwardTarget) => {
				const chain = segment.parse(session.content)
				let start = 0
				filterOutEmpty(chain)

				if (chain?.[0]?.type === 'quote') {
					const record = target.cache.use && findForwardedMessage(chain[0].data?.id, session.platform, target.platform, true)
					for (let _ = 0; _ < 2; _++) {
						if (chain?.[1]?.type === 'at') {
							if (chain?.[2]?.type === 'text' && chain[2].data.content?.startsWith(' ')) {
								chain[2].data.content = chain[2].data.content.slice(1)
								if (!chain[2].data.content) { chain.splice(2, 1) }
							}
							chain.splice(1, 1)
						}
					}
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
						} else {
							chain[0] = {
								type: 'text',
								data: {
									content: `[回复 ${segment.at(record.author.username)}: ${record.shortcut}] `
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

				if (target.platform !== session.platform) {
					for (const i in chain) {
						if (chain[i].type === 'at' && chain?.[+i + 1].type === 'text') {
							if (chain[+i + 1].data.content && !chain[+i + 1].data.content[0].match(/\s/) && chain[+i + 1].data.content?.match(/\S/)) {
								chain[+i + 1].data.content = ' ' + chain[+i + 1].data.content
							}
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
					case "kook": {
						messages = await adaptKook(chain, ctx, session, target)
						break
					}
					case "telegram": {
						messages = await adaptTelegram(chain, ctx, session, target, start)
						break
					}
					default: {
						messages = [segment.join(chain)]
					}
				}

				for (const message of messages) {
					// logger.info('send', target.to, [loggerToText(message)])

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


function loggerBeautify(node: any) {
	if (typeof node === 'object') {
		const res = {}
		for (const i in node) {
			if (i !== 'capture') {
				res[i] = loggerBeautify(node[i])
			}
		}
		return res
	} else {
		if (typeof node === 'string') { return node.slice(0, 30) }
		return node
	}
}

function loggerToText(plain: string): string {
	const chain = segment.parse(plain)
	for (const seg of chain) {
		switch (seg.type) {
			case 'at':
			case 'quote':
			case 'text': {
				break
			}
			case 'image': {
				if (seg.data?.url && seg.data.url.startsWith('base64://')) {
					seg.data = {
						url: seg.data.url.slice(0, 30)
					}
					break
				}
			}
			default: {
				seg.data = {}
			}
		}
	}
	return segment.join(chain)
}