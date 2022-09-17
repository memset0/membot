export interface UserMeta {
	id: string
	name?: string
	avatar?: string
}

export interface ChannelMeta {
	id: string
	name?: string
	avatar?: string
}

export interface PageData {
	id: string
	layout: string
	data: any
	user?: UserMeta,
	channel?: ChannelMeta
}