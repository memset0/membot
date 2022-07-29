import { Context, Session, segment } from 'koishi'

import { ForwardTarget } from '../types'
import { gif2jpg } from '../../../utils/file-type'

export const name = 'forward-telegram'

export const TelegramMarkdownV2CharactersNeedEscape = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']

export default async function adaptPlatformTelegram(chain: any[], ctx: Context, session: Session, target: ForwardTarget, metaLength: number) {
	const prefixLength = metaLength + (target.options.usePrefix ? 1 : 0)
	const prefix = target.options.usePrefix ? segment.join(chain.slice(0, prefixLength)) : null
	const chains = []

	if (target.options.useMarkdown) {
		for (let i = prefixLength; i < chain.length; i++) {
			if (chain[i].type === 'text') {
				// https://core.telegram.org/bots/api#markdownv2-style
				for (const c of TelegramMarkdownV2CharactersNeedEscape) {
					chain[i].data.content = chain[i].data.content.replace(new RegExp('\\' + c, 'g'), '\\' + c)
				}
			}
		}
	}

	if (target.options.useHTML) {
		for (let i = prefixLength; i < chain.length; i++) {
			if (chain[i].type === 'text') {
				// https://core.telegram.org/bots/api#html-style
				chain[i].data.content = chain[i].data.content
					.replace(/\&/g, '&amp;')
					.replace(/\</g, '&lt;')
					.replace(/\>/g, '&gt;')
			}
		}
	}

	for (const i in chain) {
		if (chain[i].type === 'image') {
			console.log(chain[i].data.url.slice(0, 30))
			if (chain[i].data.url.startsWith('base64://R0lGOD')) {
				// mime gif
				const buffer = Buffer.from(chain[i].data.url.slice(9), 'base64')
				// uploading gif with `sendAnimation` method is borken now
				// this is a temporary fallback
				chain[i].data.url = 'base64://' + (await gif2jpg(buffer)).toString('base64')
				console.log(chain[i].data.url.slice(0, 30), '!!!')
			}
		}
	}

	let imageCount = 0
	for (const i in chain) { imageCount += chain[i].type === 'image' ? 1 : 0 }

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
				chain[i] = {
					type: 'text',
					data: {
						content: l >= 0 && r < chain.length ? ` ${target.options.type2text['image']} ` : ''
					}
				}
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

	// ctx.logger(name).info(chains.map(str => str.slice(0, 100)))

	return chains
}