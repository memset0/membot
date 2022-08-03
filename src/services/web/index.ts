import { Context } from 'koishi'
import path from 'path'
import moment from 'moment'
import express from 'express'
import hash from 'object-hash'
import bodyParser from 'body-parser'

export const name = 'web' as const

declare module 'koishi' {
	interface Context {
		web: WebService
	}
}

export interface Config {
	key: string
	port: number
	hostname: string
}

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
		const hashed = hash({
			_key: hashData?.key || this.config.key,
			_template: template,
			...hashData,
		}, {
			algorithm: 'sha1',
		}).slice(0, 8)
		this.pageCache[hashed] = [template, data]
		if (~cacheTime) {
			// TODO
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
			moment: moment,
		}

		this.pageCache = {}

		this.app.get('/p/:hash', (req, res, next) => {
			if (!Object.keys(this.pageCache).includes(req.params.hash)) { return next() }
			const data = this.pageCache[req.params.hash]
			res.render(data[0], {
				...this.global,
				...data[1],
			})
		})
	}
}