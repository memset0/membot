import { Logger, Context } from 'koishi'
import fs from 'fs'
import Koa from 'koa'
import path from 'path'
import { URL } from 'url'
import cors from '@koa/cors'
import hash from 'object-hash'
import sendFile from 'koa-send'
import Router from '@koa/router'
import staticHost from 'koa-static'
import MarkdownIt from 'markdown-it'
import bodyParser from 'koa-bodyparser'

import { Config } from './index'

const viteDist = path.join(__dirname, 'vite/dist')

export interface PageData {
	layout: string
	cacheTime?: number
	data: any
}

export class WebService {
	private router: Router
	private logger: Logger
	private markdown: MarkdownIt

	private pages: { [hash: string]: PageData }

	register(hashData: any, data: PageData): string {
		let route: string
		if (!hashData) {
			route = hash({
				_key: hashData?.key || this.config.key,
				r: Math.random(),
			}).slice(0, 8)
		} else if (typeof hashData === 'string') {
			route = hashData
		} else {
			route = hash({
				_key: hashData?.key || this.config.key,
				...hashData,
			}, {
				algorithm: 'sha1',
			}).slice(0, 8)
		}

		this.pages[route] = data

		if (data?.cacheTime) {
			setTimeout(() => {
				delete this.pages[route]
				this.pages[route] = null
			}, data.cacheTime)
		}

		return `${this.config.hostname}/${route}`
	}

	registerKoaRouter(): void {
		this.router.get('/api/get/:key', (ctx, next) => {
			const key = ctx.params.key as string
			if (key in this.pages) {
				let data = this.pages[key]
				let goNext = false
				if (data instanceof Function) {
					data = data(ctx, () => { goNext = true })
				}
				if (!goNext) {
					ctx.body = data
				} else {
					next()
				}
			} else {
				next()
			}
		})

		this.router.get('/:key', async (ctx, next) => {
			const key = ctx.params.key as string
			if (key in this.pages) {
				ctx.url = '/'   // SPA Fallback, rewrite to index
				await next()
			} else {
				await next()
			}
		})
	}

	registerKoaApp(): void {
		if (process.env.NODE_ENV === 'development') {
			this.app.use(cors())
		}

		this.app.use(async (ctx, next) => {
			const url = ctx.url
			const startTime = Date.now()
			await next()
			const responseTime = Date.now() - startTime
			ctx.set('X-Response-Time', `${responseTime}ms`)
			this.logger.info(`${ctx.method} ${url} - ${responseTime}`)
		})

		this.app.use(bodyParser())

		this.app.use(staticHost(viteDist, {
			index: false,
			gzip: true,
		}))

		this.app
			.use(this.router.routes())
			.use(this.router.allowedMethods())

		// SPA Root
		this.app.use(async (ctx, next) => {
			if (ctx.request.method === 'GET' && ctx.request.path === '/') {
				await sendFile(ctx, 'index.html', { root: viteDist })
			} else {
				next()
			}
		})

		// Error Handler
		this.app.use(async (ctx, next) => {
			ctx.body = '404'
		})

		this.app.listen(this.config.port)
	}

	registerHomePage() {
		const readmeMarkdown = fs.readFileSync(path.join(__dirname, '../../../README.md')).toString()
		const readmeHTML = this.markdown.render(readmeMarkdown)
		this.register('home', {
			layout: 'home',
			data: {
				readme: readmeHTML,
			}
		})
	}

	constructor(
		private ctx: Context,
		private app: Koa,
		private config: Config,
	) {
		this.router = new Router()
		this.logger = this.ctx.logger('koa-app')
		this.markdown = new MarkdownIt({
			html: true,
		})
		this.pages = {}

		this.registerKoaRouter()
		this.registerKoaApp()
		this.registerHomePage()
	}
}