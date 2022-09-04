import { Context, segment } from 'koishi'
import fs from 'fs'
import path from 'path'
import assert from 'assert'
import request, { SuperAgentStatic } from 'superagent'

declare module 'koishi' {
	interface Context {
		image: ImageService
	}
}

export interface ApiConfig {
	root: string
	email: string
	password: string
	strategy?: number
}

export interface Config {
	api: ApiConfig
	methods?: {
		[K: string]: Partial<ApiConfig>
	}
}


export const name = 'image' as const

export function apply(ctx: Context, config: Config) {
	assert(config.api && config.api.root && config.api.email && config.api.password)
	config.methods = config.methods || {}

	Context.service('image')
	ctx.app.image = new ImageService(ctx, config)

	ctx.command('image', '图床', { authority: 2 })
		.alias('img')

	ctx.command('image.upload', '图片上传', { authority: 2 })
		.action(async ({ session }) => {
			const chain = segment.parse(session.content)
			const images = []
			for (const seg of chain) {
				if (seg.type === 'image') {
					images.push(seg.data.url || seg.data.file)
				}
			}
			if (!images.length) { return '没有要上传的图片' }
			const uploaded = await Promise.all(images.map(image => ctx.image.upload(image)))
			return uploaded.join('\n')
		})
}


export class ImageService {
	agent: SuperAgentStatic
	token: string

	async upload(image: string | Buffer, filename?: string): Promise<string | null> {
		try {
			if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
				const res = await request.get(image)
					.buffer(true)
					.parse(request.parse.image)
				image = res.body
			}
			const req = this.agent.post(this.config.api.root + '/upload')
				.attach('file', image, { filename: filename || 'membot.png' })
			if (this.config.api.strategy) { req.field('strategy', this.config.api.strategy) }
			const res = await req
			return res.body.data.links.url || null
		} catch (error) {
			this.ctx.logger('image-internal').error(error)
			return null
		}
	}

	async init() {
		const res = await request.post(this.config.api.root + '/tokens')
			.send({
				email: this.config.api.email,
				password: this.config.api.password,
			})
		this.token = res.body.data.token
		if (!this.token) {
			this.ctx.logger('image-internal').error('Image hosting service login failed!', res)
			throw new Error('Image hosting service login failed!')
		}

		this.agent = request.agent()
			.set({
				Authorization: 'Bearer ' + this.token,
				Accept: 'application/json',
			})
	}

	constructor(
		private ctx: Context,
		private config: Config
	) {
		this.init()
	}
}