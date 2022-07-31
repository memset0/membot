import { segment } from 'koishi'

import { Template } from './template'


export interface Broadcast {
	image?: string
	images?: string[]

	type: string
	title: string

	link?: string
	links?: string[]

	content?: string

	operation?: [string, string][]
	tag?: string[]
}

export class Broadcast extends Template {
	toString(platform?: string): string {
		let buffer = ''

		if (this.image || this.images?.length) {
			for (const image of this.image ? [this.image] : this.images) {
				buffer += segment('image', { url: image })
				if (platform !== 'telegram') { buffer += '\n' }
			}
		}

		if (platform === 'telegram') {
			buffer += `<strong><u>#${this.type}</u> ${this.title}</strong>\n`
		} else {
			buffer += `[${this.type}] ${this.title}\n`
		}

		if (this.content) {
			buffer += this.content
			if (!this.content.endsWith('\n')) buffer += '\n'
		}

		if (this.operation?.length) {
			for (const [name, command] of this.operation) {
				if (this.operation.length > 1) {
					buffer += '· '
				}
				if (platform === 'telegram') {
					buffer += `${name}: <code>${command}</code>\n`
				} else {
					buffer += `${name}:  ${command}\n`
				}
			}
		}

		if (this.link || this.links?.length) {
			for (const link of this.link ? [this.link] : this.links) {
				if (this.links) { buffer += '· ' }
				buffer += link + '\n'
			}
		}

		if (this.tag?.length) {
			for (const tag of this.tag) {
				buffer += `#${tag} `
			}
			buffer += '\n'
		}

		if (platform === 'telegram') {
			buffer = segment('html') + buffer
		}

		return buffer.replace(/\s+$/, '')
	}

	constructor(data: Broadcast) {
		super(data)
	}
}