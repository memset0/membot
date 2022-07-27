import { Context, Session, Logger, Time, segment } from 'koishi'

import '../utils/date'
import { isInteger } from '../utils/type'
import { sliceWithEllipsis } from '../utils/string'
import { QFace, getUserName } from '../utils/onebot'


interface ForwardTarget {
	to?: string
	platform?: string
	channelId?: string
	prefix?: string
	template?: string
	showSource?: boolean

	cache?: {
		use?: boolean
		limit?: number   // not supported
	}

	options?: {
		useCard?: boolean
		usePrefix?: boolean
		transformBase64?: boolean
	}
}

interface Config {
	[id: string]: Array<ForwardTarget>
}


const forwardingList: Config = {}
const messageRecord: Array<[string, string, [string, string], [string, string], [string, string], string]> = []
const KookCardThemes = ['primary', 'success', 'danger', 'warning', 'info', 'secondary']

export const name = 'forward'
export const using = ['database']
export const logger = new Logger('forward')


export async function apply(ctx: Context, config: Config) {
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
				...(e.options || {}),
			}
		}
	}

	ctx.middleware(middleware(ctx))

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
}


function middleware(ctx: Context) {
	function ignore(chain: segment.Chain) {
		if (chain?.[0]?.type === 'quote') {
			chain = chain.slice(1)
		}
		return segment.join(chain).trim().startsWith('//')
	}

	return function (session: Session, next: () => void) {
		const chain = segment.parse(session.content)
		if (!session.channelId || ignore(chain)) { return next() }
		if (session.author.userId === session.bot.selfId) { return next() }
		if (!Object.keys(forwardingList).includes(`${session.platform}:${session.channelId}`)) { return next() }

		forwardingList[`${session.platform}:${session.channelId}`]
			.forEach(async (target: ForwardTarget) => {
				let start = 0

				if (chain?.[0]?.type === 'quote') {
					let flag = false
					start++

					if (target.cache.use) {
						const rec = messageRecord.find(([platform1, platform2, [id1], [id2]]) =>
							platform1 === session.platform && platform2 === target.platform && id1 === chain[0].data.id ||
							platform1 === target.platform && platform2 === session.platform && id2 === chain[0].data.id)
						const data = rec?.[2][0] === chain[0].data.id ? rec?.[3] : rec?.[2]
						const author = rec?.[4]
						const shortcut = rec?.[5]
						if (data) {
							flag = true
							if (target.platform === 'onebot') {
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

					if ((seg.type === 'card' || seg.type === 'json' || seg.type === 'forward') && target.platform !== session.platform) {
						chain[i] = { type: 'text', data: { content: '' } }
					}

					if (seg.type === 'image' && seg.data.url?.startsWith('http') && target.options.transformBase64) {
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

					if (seg.type === 'at' && target.platform !== session.platform) {
						const name = seg.data.name || (await getUserName(session.platform, seg.data.id, { guildId: session.guildId, session })) || seg.data.id
						chain[i] = {
							type: 'text',
							data: { content: `@${name}` }
						}
					}

					if (seg.type === 'face' && target.platform !== session.platform) {
						chain[i] = {
							type: 'text',
							data: { content: `[${QFace.idToText(seg.data.id)}]` }
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
								.replace(/<userName>/g, session.author.username)
						},
					})
				}

				switch (target.platform) {
					case "kaiheila": {
						adaptPlatformKook(chain, session, target)
						break
					}
					// case "telegram": {
					// 	adaptPlatformTelegram(chain, session, target)
					// 	break
					// }
				}

				ctx.broadcast([target.to], segment.join(chain))
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
			})

		return next()
	}
}


function adaptPlatformKook(chain: any[], session: Session, target: ForwardTarget) {
	if (target.options.useCard) {
		const time = new Date(session.timestamp)
		const theme = isInteger(session.author.userId) ?
			KookCardThemes[parseInt(session.author.userId) % (KookCardThemes.length - 1)] :
			'secondary'
		const modules: any[] = []
		for (let l = 0, r = -1, m = -1; l < chain.length; l = r) {
			m = l
			while (m < chain.length && chain[m].type !== 'image') { m++ }
			r = m
			while (r < chain.length && chain[r].type === 'image') { r++ }
			let content = segment.join(chain.slice(l, m))
				.replace(/\&\#91\;/g, '[')
				.replace(/\&\#93\;/g, ']')
			if (l > 0) { content = content.replace(/^\s+/, '') }
			if (r < chain.length) { content = content.replace(/\s+$/, '') }
			modules.push([{
				'type': 'section',
				'mode': 'left',
				'text': {
					'type': 'kmarkdown',
					'content': `**${session.username}** ${time.format('yyyy-MM-dd hh:mm:ss')}\n${content}`
				},
				'accessory': { 'type': 'image', 'size': 'sm', 'src': session.author.avatar }
			}])
			if (r - m === 1) {
				modules[modules.length - 1].push({
					'type': 'container',
					'elements': [{
						'type': 'image',
						'src': chain[m].data.url
					}]
				})
			} else if (r - m > 1) {
				modules[modules.length - 1].push({
					'type': 'image-group',
					'elements': chain.slice(m, r).map((e) => ({ 'type': 'image', 'src': e.data.url }))
				})
			}
			if (target.showSource) {
				modules[modules.length - 1].push({
					'type': 'context',
					'elements': [{
						'type': 'kmarkdown',
						'content': `来自 ${session.platform} 平台的消息`
					}],
				})
			}
		}
		chain.splice(0, chain.length)
		for (const i in modules) {
			chain.push({
				type: 'card',
				data: {
					content: JSON.stringify({
						'type': 'card',
						'theme': theme,
						'size': 'lg',
						'modules': modules[i]
					})
				},
			})
		}
	}
}