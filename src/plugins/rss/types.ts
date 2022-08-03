import { Time, Schema } from 'koishi'


export interface Config {
	timeout?: number
	refresh?: number
	userAgent?: string
	defaults?: RSSOptions
}

export const Config: Schema<Config> = Schema.object({
	timeout: Schema.number().description('请求数据的最长时间。').default(Time.second * 10),
	refresh: Schema.number().description('刷新数据的默认时间间隔。').default(Time.minute),
	userAgent: Schema.string().description('请求时使用的 User Agent。'),
})


export interface Filter {
	[tag: string]: string[]
	_image_prefix: string[]
}

export interface RSSOptions {
	title?: string
	type?: string
	tag?: string[]
	feature?: {
		summary?: boolean
		image?: boolean
	}
	filter?: Filter
	filter_out?: Filter
}


export interface Feed {
	id?: number
	channel: string
	url: string
	refresh: number
	last_update: Date
	options: RSSOptions
}


export interface FeedItem {
	title?: string
	description?: string
	summary?: string
	date?: Date | null
	pubdate?: Date | null
	link?: string
	origlink?: string
	author?: string
	guid?: string
	comments?: string
	image?: any
	categories?: string
	enclosures?: any
	meta?: any
	[key: string]: any
}


export interface UrlHook {
	[url: string]: Feed[]
}