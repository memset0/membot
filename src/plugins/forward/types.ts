export interface ForwardTarget {
	to?: string
	platform?: string
	channelId?: string
	prefix?: string
	template?: string
	showSource?: boolean

	cache?: {
		use?: boolean
		limit?: number   // not supported
	}

	options?: {
		useCard?: boolean
		usePrefix?: boolean
		boldedPrefix?: boolean   // not supported
		transformBase64?: boolean
	}
}

export interface MessageRecord =[
	string,
	string,
	[string, string],
	[string, string],
	[string, string],
	string
]