export enum NoteStatus {
	deleted,
	default,
	archived,
}

export interface NoteExtend {
	images?: Array<string>
}

export interface NoteMeta {
	id?: number
	status?: NoteStatus
	userId: string
	channelId: string
	content: string
	time: Date
	extend: NoteExtend
}