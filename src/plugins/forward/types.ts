export interface TypeDictionary {
	[type: string]: string
}

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
		type2text?: TypeDictionary
	}
}

export type MessageRecord = [
	string,
	string,
	[string, string],
	[string, string],
	[string, string],
	string
]

export const Type2Text: TypeDictionary = {
	image: '<图片>',
	file: '<文件>',
	card: '<卡片>',
	record: '<录音>',
	json:'<小程序>',
	forward: '<转发的消息>',
	audio: '<音频>',
	photo: '<照片>',
	document: '<文档>',
	game: '<游戏>',
	video: '<视频>',
	voice: '<录音>',
	contact: '<联系人>',
	location: '<位置>',
	venue: '<地点>',
	'*unknown': '<不支持的消息>',
}