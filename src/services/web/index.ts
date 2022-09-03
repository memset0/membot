import { Context } from 'koishi'
import ejs from 'ejs'
import path from 'path'
import moment from 'moment'
import express from 'express'
import hash from 'object-hash'
import bodyParser from 'body-parser'

declare module 'koishi' {
	interface Context {
		web: WebService
	}
}

export interface Config {
	key: string
	port: number
	hostname: string
	logoUrl: string
	faviconUrl: string
}


const EjsOptions = {
	async: true
} as const


export const name = 'web' as const

export function apply(ctx: Context, config: Config) {
	if (!config.key) {
		throw new Error('Web services require a key for security')
	}
	config.port = config.port || 3000
	config.hostname = config.hostname || `http://localhost:${config.port}`

	const app = express()
	app.listen(config.port)
	app.set('views', path.join(__dirname, 'views'))
	app.set('view engine', 'ejs')
	app.use(bodyParser.json())
	app.use(bodyParser.urlencoded({ extended: true }))
	app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }))

	app.engine('ejs', async (path, data, callback) => {
		try {
			let html = await ejs.renderFile(path, data, EjsOptions)
			callback(null, html)
		} catch (error) {
			callback(error, '')
		}
	})

	app.get('/', function (req, res) {
		res.render('index', {
			title: 'membot',
			message: 'Hello, World!',
		})
	})

	Context.service('web')
	ctx.app.web = new WebService(app, ctx, config)
}


export class WebService {
	app: express.Application
	ctx: Context
	config: Config
	global: any

	pageCache: { [hash: string]: [string, any] }

	registerPage(hashData: any, template: string, data: any, cacheTime: number = -1): string {
		const hashed = hashData ? hash({
			_key: hashData?.key || this.config.key,
			_template: template,
			...hashData,
		}, {
			algorithm: 'sha1',
		}).slice(0, 8) : hash({
			_key: hashData?.key || this.config.key,
			r: Math.random(),
		}).slice(0, 8)
		this.pageCache[hashed] = [template, data]
		if (~cacheTime) {
			setTimeout(() => {
				delete this.pageCache[hashed]
				this.pageCache[hashed] = null
			}, cacheTime)
		}
		return `${this.config.hostname}/p/${hashed}`
	}

	constructor(app: express.Application, ctx: Context, config: Config) {
		this.app = app
		this.ctx = ctx
		this.config = config
		this.global = {
			koishi: ctx.app.options,
			title: 'membot',
			moment,
			config,
		}

		this.pageCache = {}

		this.app.get('/p/:hash', (req, res, next) => {
			const data = this.pageCache[req.params.hash]
			if (!data) {
				res.status(404)
				if (Object.keys(this.pageCache).includes(req.params.hash)) {
					return res.render('404', {
						...this.global,
						type: 'warning',
						message: `请求的页面已过期，请重新调用指令。`,
					})
				} else {
					return res.render('404', {
						...this.global,
						message: `请求的页面不存在！您可能输入了错误的地址，或者页面已过期。`,
					})
				}
			}
			return res.render(data[0], {
				...this.global,
				...data[1],
			})
		})
	}
}