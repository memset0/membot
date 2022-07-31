import { Context, Logger, Database } from 'koishi'
import xss from 'xss'
import md5 from 'md5'
import { friendlyAttrValue } from 'xss'
import { convert as htmlToText } from 'html-to-text'
import RssFeedEmitter from 'rss-feed-emitter'

import { Config, Feed, UrlHook, FeedItem } from './types'
import { Broadcast } from '../../templates/broadcast'

export async function fetchTitle(url: string): Promise<string> {
	return 'untitled'
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
		return new RssFeedEmitter({
			skipFirstLoad: true,
			userAgent: this.config.userAgent
		})
	}

	addFeed(feed: Feed): boolean {
		const { url } = feed
		if (!this.hook[url]) {
			this.hook[url] = []
			this.feeder.add({
				url,
				refresh: feed.refresh
			})
			this.feeder.on(md5(url), (payload: FeedItem) => {
				this.logger.info('receive', url)
				for (const feed of this.hook[url]) {
					this.receive(feed, payload)
				}
			})
		}
		this.hook[url].push(feed)
		return true
	}

	delFeed(feed: Feed): boolean {
		const { url } = feed
		if (!this.hook[url]) { return false }
		for (const i in this.hook[url]) {
			if (this.hook[url][i].id === feed.id) {
				this.hook[url].splice(+i, 1)
				return true
			}
		}
		return false
	}

	updateFeed(feed: Feed): boolean {
		const { url } = feed;
		if (!this.hook[url]) { return false; }
		for (const i in this.hook[url]) {
			if (this.hook[url][i].id === feed.id) {
				this.hook[url].splice(+i, 1, feed)
				return true
			}
		}
	}

	async initialize() {
		const feeds = (await this.database.get('rssfeed', { id: { $gt: 0 } })) as Feed[]
		for (const feed of feeds) {
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

	receive(feed: Feed, payload: FeedItem) {
		this.logger.info('receive', feed, payload)

		const boardcast = new Broadcast({
			type: 'RSS',
			title: payload.title,
			link: payload.link,
			content: '',
			image: '',
			tag: feed.options.tag || [],
		})

		if (feed.options.feature?.summary) {
			boardcast.content = htmlToText((payload.summary || payload.description), {
				wordwrap: 1 << 30,
				selectors: [
					{ selector: 'a', options: { ignoreHref: true } },
					{ selector: 'img', format: 'skip' }
				]
			})
			const limit = 250
			if (boardcast.content.length > limit) {
				boardcast.content = boardcast.content.slice(0, limit - 3) + '...'
			}
		}

		if (feed.options.feature?.image) {
			xss(payload.description, {
				onTagAttr: (tag, name, value) => {
					if (tag === "img" && name === "src") {
						boardcast.image = boardcast.image || friendlyAttrValue(value);
					}
				},
			})
		}

		this.ctx.broadcast([feed.channel], boardcast.toString(feed.channel.split(':', 1)[0]))
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