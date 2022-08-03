import { Context } from 'koishi'
import path from 'path'
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

	registerPage(hashData: any, template: string, data: any): string {
		const path = '/p/' + hash({
			_key: hashData?.key || this.config.key,
			_template: template,
			...hashData,
		}, {
			algorithm: 'sha1',
		}).slice(0, 8)
		this.app.get(path, (req, res) => {
			res.render(template, data)
		})
		return this.config.hostname + path
	}

	constructor(app: express.Application, ctx: Context, config: Config) {
		this.app = app
		this.ctx = ctx
		this.config = config
	}
}