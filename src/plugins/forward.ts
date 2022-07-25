import { Context, Session, Logger, Time, segment } from 'koishi'

import '../utils/date'
import { isInteger } from '../utils/type'
import { sliceWithEllipsis } from '../utils/string'
import { QFace, getUserName } from '../utils/onebot'


interface ForwardingMeta {
	to?: string
	platform?: string
	channelId?: string
	prefix?: string
	enhanced?: boolean
	showSource?: boolean
}

interface Config {
	[id: string]: Array<ForwardingMeta>
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
			if (!e.to || !e.platform || !e.channelId) { logger.warn('missing target channel config') }
			if (!e.prefix) { e.prefix = '' }
			if (e.platform != 'kaiheila' && e.enhanced) { logger.warn(`platform ${source.split(':')[0]} does't support enhanced mode`) }
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


function ignore(chain: segment.Chain) {
	if (chain?.[0]?.type === 'quote') {
		chain = chain.slice(1)
	}
	return segment.join(chain).trim().startsWith('//')
}


function middleware(ctx: Context) {
	return function (session: Session, next: () => void) {
		const chain = segment.parse(session.content)
		if (!session.channelId || ignore(chain)) { return next() }
		if (!Object.keys(forwardingList).includes(`${session.platform}:${session.channelId}`)) { return next() }

		forwardingList[`${session.platform}:${session.channelId}`]
			.forEach(async (target: ForwardingMeta) => {
				let start = 0
				let transformBase64 = !(target.platform === 'kaiheila')

				if (chain?.[0]?.type === 'quote') {
					const quote = chain?.[0]
					start++
					const rec = messageRecord.find(([platform1, platform2, [id1], [id2]]) =>
						platform1 === session.platform && platform2 === target.platform && id1 === quote.data.id ||
						platform1 === target.platform && platform2 === session.platform && id2 === quote.data.id)
					const data = rec?.[2][0] === quote.data.id ? rec?.[3] : rec?.[2]
					const author = rec?.[4]
					const shortcut = rec?.[5]
					if (data) {
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
							chain.splice(1, 1)
							if (chain[0].type == 'text') {
								chain[0].data.content = chain[0].data.content.trim()
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

					if ((seg.type === 'card' || seg.type === 'json' || seg.type === 'forward') && target.platform !== session.platform) {
						chain[i] = { type: 'text', data: { content: '' } }
					}

					if (seg.type === 'image' && seg.data.url?.startsWith('http') && transformBase64) {
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

				if (!target.enhanced) {
					chain.splice(start, 0, {
						type: 'text',
						data: { content: (target.prefix || '') + `${session.username}: `, },
					})

				} else if (target.platform === 'kaiheila') {
					const time = new Date(session.timestamp)
					const theme = isInteger(session.author.userId) ?
						KookCardThemes[parseInt(session.author.userId) % (KookCardThemes.length - 1)] :
						'secondary'
					const modules = []
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

				ctx.broadcast([target.to], segment.join(chain))
					.then(([id]) => {
						messageRecord.push([
							session.platform,
							target.platform,
							[session.messageId, session.channelId],
							[id, target.channelId],
							[session.author.userId, session.author.nickname || session.author.username],
							sliceWithEllipsis(shortcut.join(' '), 15),
						])
						if (messageRecord.length > 1000) {
							messageRecord.shift()
						}
					})
			})

		return next()
	}
}