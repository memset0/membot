import { Context, Session, segment } from 'koishi'

import { ForwardTarget } from '../types'
import { isInteger } from '../../../utils/type'


export const CARD_THEMES = ['primary', 'success', 'danger', 'warning', 'info', 'secondary']


export default function adaptPlatformKook(chain: any[], ctx: Context, session: Session, target: ForwardTarget) {
	if (target.options.useCard) {
		const time = new Date(session.timestamp)
		const theme = isInteger(session.author.userId) ?
			CARD_THEMES[parseInt(session.author.userId) % (CARD_THEMES.length - 1)] :
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
			if (target.options.showSource) {
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

	return [segment.join(chain)]
}