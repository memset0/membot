import { Logger, Context, Session, Time } from 'koishi'
import fs from 'fs'
import Koa from 'koa'
import path from 'path'
import assert from 'assert'
import cors from '@koa/cors'
import hash from 'object-hash'
import sendFile from 'koa-send'
import Router from '@koa/router'
import { cloneDeep } from 'lodash'
import staticHost from 'koa-static'
import MarkdownIt from 'markdown-it'
import bodyParser from 'koa-bodyparser'

import { Config } from './index'
import { UserMeta, ChannelMeta, getUser, getChannel } from '../../utils/usermeta'

const viteDist = path.join(__dirname, 'vite/dist')

type PageMethodCallback = (() => any) | {
	arguments: Array<string>
}

export interface PageData {
	layout: string
	data: any
	user?: UserMeta | Promise<UserMeta>
	channel?: ChannelMeta | Promise<ChannelMeta>
	cacheTime?: number
	methods?: {
		[k: string]: PageMethodCallback | boolean
	}
}

export interface PageArgument {
	route?: string
	hash?: any
	data: PageData
	session?: Session
	cacheTime?: number
}

export class WebAuthorizeError extends Error { }

export class WebService {
	private defaultCacheTime = Time.day

	private router: Router
	private logger: Logger
	private markdown: MarkdownIt

	private pages: { [hash: string]: PageData }

	private async parseUser(session: Session): Promise<UserMeta> {
		assert(session.subtype === 'private')
		return getUser(session.platform, session.userId, this.ctx)
	}

	private async parseChannel(session: Session): Promise<ChannelMeta> {
		return getChannel(session.platform, session.channelId, this.ctx)
	}

	private async handlePageData(data: PageData): Promise<PageData> {
		data.user = data.user && (await data.user)
		data.channel = data.channel && (await data.channel)
		return data
	}

	async authorize(route: string, session: Session) {
		if (!route || !(route in this.pages)) {
			throw new WebAuthorizeError('对应路由不存在')
		}
		if (session.subtype !== 'private') {
			throw new WebAuthorizeError('只支持在私有回话中授权')
		}
		const source: PageData = this.pages[route]
		if (source.user) {
			throw new WebAuthorizeError('对应链接已被授权')
		}
		const target = cloneDeep(source)
		target.user = await this.parseUser(session)
		return target
	}

	register(argv: PageArgument): string {
		const { data } = argv

		let route: string
		if (argv.route) {
			route = argv.route
		} else if (!argv.hash) {
			route = hash({ r: Math.random() }, { algorithm: 'sha1' }).slice(0, 8)
		} else {
			route = hash({ _key: argv.hash?.key || this.config.key, hash: argv.hash }, { algorithm: 'sha1' }).slice(0, 8)
		}

		if (argv.session) {
			if (argv.session.subtype === 'private') {
				data.user = data.user || this.parseUser(argv.session)
			} else {
				data.channel = data.channel || this.parseChannel(argv.session)
			}
		}

		this.pages[route] = data

		setTimeout(() => {
			delete this.pages[route]
			this.pages[route] = null
		}, argv.cacheTime || this.defaultCacheTime)

		return `${this.config.hostname}/${route}`
	}

	registerKoaRouter(): void {
		this.router.get('/api/get/:key', async (ctx, next) => {
			const key = ctx.params.key as string
			if (key in this.pages) {
				let data = this.pages[key]
				ctx.body = await this.handlePageData(data)
			} else {
				await next()
			}
		})

		this.router.get('/:key', async (ctx, next) => {
			const key = ctx.params.key as string
			if (key in this.pages) {
				ctx.url = '/'   // The SPA Fallback, should rewrite to index page
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

	registerGlobalPages() {
		this.register({
			route: 'test',
			data: { layout: 'basic', data: 'hello' },
		})

		const readmeMarkdown = fs.readFileSync(path.join(__dirname, '../../../README.md')).toString()
		const readmeHTML = this.markdown.render(readmeMarkdown)
		this.register({
			route: 'home',
			data: {
				layout: 'home',
				data: {
					readme: readmeHTML,
				},
			},
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
		this.registerGlobalPages()
	}
}