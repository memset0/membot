import { Context } from 'koishi'
import fs from 'fs'
import ejs from 'ejs'
import path from 'path'
import { URL } from 'url'
import moment from 'moment'
import express from 'express'
import hash from 'object-hash'
import bodyParser from 'body-parser'
import MarkdownIt from 'markdown-it'
import proxy from 'express-http-proxy'

import { getChannelAvatar, getChannelName } from '../../utils/avatar'

// declare module 'koishi' {
// 	interface Context {
// 		web: WebService
// 	}
// }

export interface Config {
	key: string
	port: number
	hostname: string
	logoUrl: string
	faviconUrl: string
	proxyPrefix: Array<string>
}


export const name = 'web' as const

const EjsOptions = {
	async: true
} as const


export function apply(ctx: Context, config: Config) {
	if (!config.key) {
		throw new Error('Web services require a key for security')
	}
	config.port = config.port || 3000
	config.hostname = config.hostname || `http://localhost:${config.port}`
	config.proxyPrefix = config.proxyPrefix || []

	const globalArgs = {
		koishi: ctx.app.options,
		title: 'membot',
		moment,
		config,
		displayId: undefined,
		displayName: undefined,
		displayAvatar: undefined,
	}

	async function handleArgs(data: any) {
		for (const key in globalArgs) {
			if (!(key in data)) {
				data[key] = globalArgs[key]
			}
		}
		if (data.session) {
			data.displayId = data.session.subtype === 'private' ? data.session.userId : data.session.channelId
			data.displayName = data.displayName
				|| (data.session.subtype === 'private' && data.session.username)
				|| (await getChannelName(data.session.platform, data.session.channelId, ctx))
				|| (data.session.platform + ':' + data.displayId)
			data.displayAvatar = data.displayAvatar
				|| (await getChannelAvatar(data.session.platform, data.session.channelId, ctx))
		}
		return data
	}

	const webService = new WebService(ctx, config)

	const markdown = new MarkdownIt({
		html: true,
	})
	const readmeMarkdwon = fs.readFileSync(path.join(__dirname, '../../../README.md')).toString()
	const readmeHTML = markdown.render(readmeMarkdwon)

	const app = express()
	app.listen(config.port)
	app.set('views', path.join(__dirname, 'views'))
	app.set('view engine', 'ejs')
	app.use(bodyParser.json())
	app.use(bodyParser.urlencoded({ extended: true }))
	app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }))

	app.engine('ejs', async (path, data, callback) => {
		try {
			let html = await ejs.renderFile(path, await handleArgs(data), EjsOptions)
			callback(null, html)
		} catch (error) {
			callback(error, '')
		}
	})

	app.get('/', function (req, res) {
		res.render('index', {
			title: 'membot',
			readme: readmeHTML,
		})
	})

	app.use('/proxy', proxy('http://localhost', {
		https: true,
		memoizeHost: false,
		filter(req, res) {
			if (!(req.method === 'GET')) { return false }
			const url = req.url.slice(1)
			let flag = false
			for (const prefix of config.proxyPrefix) {
				if (url.startsWith(prefix)) {
					flag = true
					break
				}
			}
			return flag
		},
		proxyReqPathResolver(req) {
			const url = new URL(req.url.slice(1))
			return url.pathname
		},
		proxyReqOptDecorator(proxyReqOpts, originalReq) {
			const url = new URL(originalReq.url.slice(1))
			proxyReqOpts.host = url.hostname
			proxyReqOpts.port = url.port ? +url.port : 80
			return proxyReqOpts
		},
		skipToNextHandlerFilter: function (proxyRes) {
			return !([200, 400, 401, 404].includes(proxyRes.statusCode));
		},
		userResDecorator(proxyRes, proxyResData, userReq, userRes) {
			return proxyResData
		},
	}))

	app.get('/:hash', (req, res) => {
		const data = webService.pages[req.params.hash]
		if (!data) {
			res.status(404)
			if (req.params.hash in webService.pages) {
				return res.render('404', {
					type: 'warning',
					message: `请求的页面已过期，请重新调用指令。`,
				})
			} else {
				return res.render('404', {
					message: `请求的页面不存在！您可能输入了错误的地址，或者页面已过期。`,
				})
			}
		}
		return res.render(data[0], {
			...data[1],
		})
	})

	Context.service('web')
	ctx.app.web = webService
}


export class WebService {
	global: any

	pages: { [hash: string]: [string, any] }

	register(hashData: any, template: string, data: any, cacheTime: number = -1): string {
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
		this.pages[hashed] = [template, data]
		if (~cacheTime) {
			setTimeout(() => {
				delete this.pages[hashed]
				this.pages[hashed] = null
			}, cacheTime)
		}
		return `${this.config.hostname}/${hashed}`
	}

	constructor(
		private ctx: Context,
		private config: Config
	) {
		this.pages = {}
	}
}