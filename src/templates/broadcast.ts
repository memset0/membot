import { Element, segment } from 'koishi'
import structuredClone from '@ungap/structured-clone';

import { Template } from './template'
import { escapeTelegramHTML } from '../utils/string'


export interface Broadcast {
	image?: string
	images?: string[]

	type: string
	title?: string

	link?: string
	linkname?: string

	content?: string
	elements?: Array<Element>

	operation?: [string, string][]
	tag?: string[]
}

export class Broadcast extends Template {
	static render(data: Broadcast, platform?: string): string {
		if (platform === 'telegram') {
			data = this.applyFilter(structuredClone(data), escapeTelegramHTML)
		}

		let buffer = ''

		if (data.image || data.images?.length) {
			for (const image of data.image ? [data.image] : data.images) {
				buffer += segment.image(image).toString()
				if (platform !== 'telegram') { buffer += '\n' }
			}
		}

		data.title = data.title || ''
		if (platform === 'telegram') {
			buffer += `<strong><u>#${data.type}</u> ${data.title}</strong>\n`
		} else {
			buffer += `[${data.type}] ${data.title}\n`
		}

		if (data.link) {
			if (platform === 'telegram') {
				buffer += `<a href="${data.link}">${data.linkname || data.link}</a>\n`
			} else {
				if (data.linkname) { buffer += `${data.linkname} ` }
				buffer += `${data.link}\n`
			}
		}

		const content = data.content
			? data.content
			: (data.elements
				? segment.transform(data.elements, {}).map(x => x.toString()).join('')
				: '')
		buffer += content
		if (!content.endsWith('\n')) {
			buffer += '\n'
		}

		if (data.operation?.length) {
			for (const [name, command] of data.operation) {
				if (data.operation.length > 1) {
					buffer += '· '
				}
				if (platform === 'telegram') {
					buffer += `${name}: ${command}\n`
					// buffer += `${name}: <code>${command}</code>\n`
				} else {
					buffer += `${name}:  ${command}\n`
				}
			}
		}

		if (data.tag?.length) {
			for (const tag of data.tag) {
				buffer += `#${tag} `
			}
			buffer += '\n'
		}

		buffer = buffer.replace(/\s+$/, '')
		buffer = buffer.replace(/\n/g, '<text content="\n"></text>')   // 确保纯文本内容和 XML 元素混排时能正确换行

		return buffer
	}

	toString(platform?: string): string {
		return Broadcast.render(this, platform)
	}

	constructor(data: Broadcast) {
		super(data)
	}
}