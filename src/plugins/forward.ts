import { Context, Session, Logger, Time, segment } from 'koishi'

import '../utils/date'
import { QFace } from '../utils/onebot'
import { isInteger } from '../utils/type'


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
const messageRecord: Array<[string, string, [string, string], [string, string]]> = []
const KookCardThemes = ['primary', 'success', 'danger', 'warning', 'info', 'secondary']

export const name = 'forward'
export const using = ['database']
export const logger = new Logger('forward')


export async function apply(ctx: Context, config: Config) {
	for (const source in config) {
		const targets = config[source]
		forwardingList[source] = targets
		for (const e of forwardingList[source]) {
			if (e.to && (e.platform || e.channelId)) { logger.warn('mutiple target channel config') }
			if (e.to) {
				e.platform = e.to.split(':')[0]
				e.channelId = e.to.split(':')[1]
			} else if (e.platform && e.channelId) {
				e.to = `${e.platform}:${e.channelId}`
			}
			if (!e.to || !e.platform || !e.channelId) { logger.warn('missing target channel config') }
			if (!e.prefix) { e.prefix = '' }
			if (e.platform != 'kaiheila' && e.enhanced) { logger.warn(`platform ${source.split(':')[0]} does't support enhanced mode`) }
		}

		// logger.info('forwardingList', source, targets)
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
			logger.info(id, forward)

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
	if (chain[0].type === 'quote') {
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
				const kookExtendedImages = []
				const quote = chain?.[0]
				let start = 0
				let transformBase64 = !(target.platform === 'kaiheila')

				if (quote?.type === 'quote') {
					start++
					const rec = messageRecord.find(([platform1, platform2, [id1], [id2]]) =>
						platform1 === session.platform && platform2 === target.platform && id1 === quote.data.id ||
						platform1 === target.platform && platform2 === session.platform && id2 === quote.data.id)
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

				for (const i in chain) {
					const seg = chain[i]

					if ((seg.type === 'image' /* || seg.type === 'face' */) && seg.data.url?.startsWith('http') && transformBase64) {
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

					if (seg.type === 'face' && target.platform !== 'onebot') {

					}

					if (target.platform == 'kaiheila' && target.enhanced) {
						if (seg.type === 'image' && seg.data.url?.startsWith('http')) {
							let showPlacer = false;
							for (let j = parseInt(i) + 1; j < chain.length; j++) {
								if (chain[j].type !== 'image') {
									showPlacer = true
									break
								}
							}
							kookExtendedImages.push(seg.data.url)
							chain[i] = {
								type: 'text',
								data: { content: showPlacer ? `~img:${kookExtendedImages.length}~` : ' ' }
							}
						} else if (seg.type === 'face') {
							chain[i] = {
								type: 'text',
								data: { content: `[${QFace.idToDes(seg.data.id)}]` }
							}
						}
					}
				}

				if (!target.enhanced) {
					chain.splice(start, 0, {
						type: 'text',
						data: {
							content: (target.prefix || '') + `${session.username}: `,
						},
					})

				} else if (target.platform === 'kaiheila') {
					const content = segment.join(chain)
						.replace(/\&\#91\;/g, '[')
						.replace(/\&\#93\;/g, ']')
					const time = new Date(session.timestamp)
					const theme = isInteger(session.author.userId) ?
						KookCardThemes[parseInt(session.author.userId) % (KookCardThemes.length - 1)] :
						'secondary'
					const modules: any[] = [{
						"type": "section",
						"mode": "left",
						"text": {
							"type": "kmarkdown",
							"content": `**${session.username}** ${time.format('yyyy-MM-dd hh:mm:ss')}\n${content}`
						},
						"accessory": { "type": "image", "size": "sm", "src": session.author.avatar }
					}]
					if (kookExtendedImages.length === 1) {
						modules.push({
							"type": "container",
							"elements": [{
								"type": "image",
								"src": kookExtendedImages[0]
							}]
						})
					} else if (kookExtendedImages.length > 1) {
						modules.push({
							"type": "image-group",
							"elements": kookExtendedImages.map((url) => ({ "type": "image", "src": url }))
						})
					}
					if (target.showSource) {
						modules.push({
							"type": "context",
							"elements": [{
								"type": "kmarkdown",
								"content": `来自 ${session.platform} 平台的消息`
							}],
						})
					}
					// logger.info('modules', modules)
					chain.splice(0, chain.length)
					chain.push({
						type: 'card',
						data: {
							content: JSON.stringify({
								"type": "card",
								"theme": theme,
								"size": "lg",
								"modules": modules
							})
						},
					})
				}

				ctx.broadcast([target.to], segment.join(chain))
					.then(([id]) => {
						messageRecord.push([session.platform, target.platform, [session.messageId, session.channelId], [id, target.channelId]])
						if (messageRecord.length > 1000) {
							messageRecord.shift()
						}
					})
			})

		return next()
	}
}