import { Context, Time, Logger, Database } from 'koishi'
import xss from 'xss'
import md5 from 'md5'
import axios from 'axios'
import sleep from 'sleep-promise'
import deepmerge from 'deepmerge'
import arrayShuffle from 'shuffle-array'
import RssFeedEmitter from 'rss-feed-emitter'
import { friendlyAttrValue } from 'xss'
import { convert as htmlToText } from 'html-to-text'

import '../../utils/date'
import { Broadcast } from '../../templates/broadcast'
import { isValidDate } from '../../utils/type'
import { Config, Feed, Filter, UrlHook, FeedItem } from './types'

export const globalFilterOut = {
	_image_prefix: [
		'https://www.zhihu.com/equation'
	]
} as Filter


export function getDisplayName(feed: Feed): string {
	return feed.options.title || `${(new URL(feed.url)).hostname} 的订阅`
}

export async function fetchTitle(url: string): Promise<string> {
	const res = await axios.get(url)
	const html = res.data
	const regexp = /\<title\>(.+)\<\/title\>/
	return html.match(regexp)?.[1] || ''
}

export async function fetchRSS(url: string, timeout: number, userAgent: string = '') {
	const res: FeedItem[] = []
	const feeder = new RssFeedEmitter({
		skipFirstLoad: false,
		userAgent,
	})
	feeder.add({
		url: url,
		refresh: 1 << 30,
	})
	let timer: NodeJS.Timeout
	return new Promise((resolve, reject) => {
		feeder.on('new-item', (payload) => { res.push(payload) })
		feeder.on('error', (error) => { reject(error) })
		timer = setTimeout(() => {
			if (res.length === 0) {
				reject(new Error('fetch RSS timeout'))
			} else {
				resolve(res.reverse())
			}
		}, timeout)
	}).finally(() => {
		feeder.destroy()
		clearTimeout(timer)
	})
}

export class RSSCore {
	ctx: Context
	hook: UrlHook
	config: Config
	logger: Logger
	feeder: RssFeedEmitter
	database: Database

	genFeeder(): RssFeedEmitter {
		const feeder = new RssFeedEmitter({
			skipFirstLoad: false,
			userAgent: this.config.userAgent
		})
		feeder.on('error', (error) => {
			this.ctx.logger('feeder').warn('error', error)
		})
		return feeder
	}

	genTimePerturbation(defaults: number): number {
		return Math.floor(Math.random() * Math.min(defaults * 0.1, this.config.timeout))
	}

	addFeed(feed: Feed): boolean {
		const link = new URL(feed.url)
		const registerTime = Date.now()
		link.search += (link.search ? '&' : '?') + `i=${feed.id}&t=${registerTime % 1000}`
		const url = link.href
		this.logger.info('add feed', url)
		if (this.hook[url]) { return false }
		this.feeder.add({
			url,
			eventName: md5(url),
			refresh: feed.refresh + this.genTimePerturbation(feed.refresh),
		})
		this.feeder.on(md5(url), async (payload: FeedItem) => {
			// this.logger.info('receive', url)
			await this.receive(feed, payload, Date.now() - registerTime < this.config.timeout ? 1 : 2)
		})
		this.hook[url] = feed
		return true
	}

	delFeed(feed: Feed): boolean {
		const { url } = feed
		if (!this.hook[url]) { return false }
		this.hook[url] = null
		return true
	}

	async initialize() {
		const feeds = (await this.database.get('rssfeed', { id: { $gt: 0 } })) as Feed[]
		for (const feed of arrayShuffle(feeds)) {
			await sleep(this.genTimePerturbation(feed.refresh))
			this.logger.info('init', feed)
			this.addFeed(feed)
		}
	}

	destroy() {
		this.hook = {}
		this.feeder.destroy()
	}

	async subscribe(feed: Feed): Promise<Feed | null> {
		feed = await this.database.create('rssfeed', {
			channel: feed.channel,
			url: feed.url,
			refresh: feed.refresh,
			last_update: feed.last_update,
			options: feed.options,
		})
		this.addFeed(feed)
		return feed
	}

	async unsubscribe(id: number): Promise<void> {
		const feed = (await this.database.get('rssfeed', [id]))[0] as Feed
		await this.database.remove('rssfeed', id)
		this.delFeed(feed)
	}

	async reload() {
		this.hook = {}
		this.feeder.destroy()
		this.feeder = this.genFeeder()
		await this.initialize()
	}

	async receive(feed: Feed, payload: FeedItem, status: number = 0) {
		feed.options = deepmerge(this.config.defaults, feed.options)

		const lastDate = (new Date((await this.database.get('rssfeed', [feed.id]))[0].last_update)) || (new Date())
		const date = (isValidDate(payload.date) && payload.date) || (isValidDate(payload.pubdate) && payload.pubdate) || (new Date())
		if (!isValidDate(payload.date) && !isValidDate(payload.pubdate)) {
			if (status === 1) { return }
		}
		if (date <= lastDate) {
			if (status) { return }
		} else {
			await this.database.set('rssfeed', [feed.id], { last_update: date })
		}
		// this.logger.info([isValidDate(payload.date), isValidDate(payload.pubdate), payload.date, payload.pubdate, new Date()])
		this.logger.info('receive', status, date, lastDate)

		const broadcast = new Broadcast({
			type: feed.options.type || 'RSS',
			title: getDisplayName(feed),
			link: payload.link,
			linkname: payload.title,
			content: '',
			image: '',
			tag: feed.options.tag || [],
		})

		if (feed.options.feature?.summary) {
			broadcast.content = htmlToText((payload.description || payload.summary), {
				wordwrap: 1 << 30,
				selectors: [
					{ selector: 'a', options: { ignoreHref: true } },
					{ selector: 'img', format: 'skip' }
				]
			}).replace(/\n\s*\n/g, '\n')
				.replace(/\n/g, '  ')
			const limit = 150
			if (broadcast.content.length > limit) {
				broadcast.content = broadcast.content.slice(0, limit - 3) + '...'
			}
		}

		if (feed.options.feature?.image) {
			xss(payload.description || payload.summary, {
				onTagAttr: (tag, name, value) => {
					if (tag === "img" && name === "src" && !broadcast.image) {
						let flag = true
						for (const prefix of [...globalFilterOut._image_prefix, ...(feed.options.filter_out?._image_prefix || [])]) {
							if (value.startsWith(prefix)) {
								flag = false
								break
							}
						}
						if (flag) {
							broadcast.image = friendlyAttrValue(value)
						}
					}
				},
			})
		}

		// this.logger.info('broadcast', broadcast)
		this.ctx.broadcast([feed.channel], broadcast.toString(feed.channel.split(':', 1)[0]))
	}

	constructor(ctx: Context, config: Config) {
		this.ctx = ctx
		this.hook = {}
		this.config = config
		this.logger = ctx.logger('rss-core')
		this.database = ctx.database

		this.feeder = this.genFeeder()
	}
}