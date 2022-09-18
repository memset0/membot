export interface UserMeta {
	id: string
	platform: string
	name?: string
	avatar?: string
}

export interface ChannelMeta {
	id: string
	platform: string
	name?: string
	avatar?: string
}

export interface PageData {
	id: string
	layout: string
	data: any
	title?: string
	user?: UserMeta,
	channel?: ChannelMeta
}