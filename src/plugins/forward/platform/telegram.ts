import { Context, Session, segment } from 'koishi'

import { ForwardTarget } from '../types'


export default function adaptPlatformTelegram(chain: any[], ctx: Context, session: Session, target: ForwardTarget, prefixPosition: number) {
	const logger = ctx.logger('forward-telegram-send')

	const prefix = target.options.usePrefix ? segment.join([chain[prefixPosition]]) : null
	const chains = []
	let imageCount = 0
	for (const i in chain) { imageCount += chain[i].type === 'image' ? 1 : 0 }

	logger.info(imageCount)

	if (imageCount === 0) {
		// 没图片，不需要特殊处理
		chains.push(chain)
	} else if (imageCount === 1) {
		// 只有一张图片，为了美观删去两侧文字多余空格
		for (const i in chains) {
			if (chains[i].type === 'image') {
				const l = parseInt(i) - 1
				const r = parseInt(i) + 1
				if (l >= 0 && chain[l].type === 'text') {
					chain[l].data.content = chain[l].data.content.replace(/\s+$/, '')
				}
				if (r < chain.length && chain[r].type === 'text') {
					chain[r].data.content = chain[r].data.content.replace(/^\s+/, '')
				}
				chain.push(chain[i])
				chain[i] = { type: 'text', data: { content: l >= 0 && r < chain.length ? ' <图片> ' : '' } }
				break
			}
		}
		chains.push(chain)
	} else {
		// 多张图片，分成多条消息发送
		for (let l = 0, r = -1; l < chain.length; l = r) {
			r = l
			while (r < chain.length && chain[r].type !== 'image') { r++ }
			if (r < chain.length && chain[r].type === 'image') {
				// 最多伴随文本消息发送一张图片
				r++
			}
			if (r < chain.length && chain[r - 1].type === 'image') {
				const ll = (r - 1) - 1
				const rr = (r - 1) + 1
				if (ll >= 0 && chain[ll].type === 'text') {
					chain[ll].data.content = chain[ll].data.content.replace(/\s+$/, '')
				}
				if (rr < chain.length && chain[rr].type === 'text') {
					chain[rr].data.content = chain[rr].data.content.replace(/^\s+/, '')
				}
			}
			logger.info(l, r)
			chains.push(chain.slice(l, r))
		}
	}

	for (const i in chains) {
		if (target.options.usePrefix && i !== '0') {
			if (chains[i].length == 1 && chains[i][0].type !== 'text') {
				// 如果发送的内容仅一个句段且不是纯文本，则不需要prefix后的多余空白字符
				chains[i] = prefix.replace(/\s+$/, '') + segment.join(chains[i])
			} else {
				chains[i] = prefix + segment.join(chains[i])
			}
		} else {
			chains[i] = segment.join(chains[i])
		}
	}

	logger.info(chains.map(str => str.slice(0, 100)))

	return chains
}