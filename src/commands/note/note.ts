import { Context, Database, Logger } from 'koishi'
import assert from 'assert'

export interface NoteUser {
	enabled: boolean
}

export interface NoteExtend {
	images?: Array<string>
}

export enum NoteStatus {
	default,
	deleted,
	archived,
}

export interface NoteMeta {
	id?: number
	status?: NoteStatus
	userId: string
	channelId: string
	content: string
	extend: NoteExtend
}

export interface NoteData {
	[userId: string]: NoteUser
}

export class Note {
	private logger: Logger
	private database: Database
	data: NoteData

	addChannel(channelId: string, userdata: NoteUser): void {
		this.logger.info('add channel', channelId, userdata)
		this.data[channelId] = userdata
	}

	deleteChannel(channelId: string): void {
		this.logger.info('delete channel', channelId)
		delete this.data[channelId]
	}

	async fetchChannel(channelId: string): Promise<Array<NoteMeta>> {
		assert(channelId in this.data)
		const result = await this.database.get('note', { channelId: { $eq: channelId } })
		this.logger.info('fetch channel', channelId, result)
		return result as Array<NoteMeta>
	}

	async addNote(channelId: string, userId: string, content: string) {
		assert(channelId in this.data)
		await this.database.create('note', {
			channelId,
			userId,
			content,
		} as NoteMeta)
	}

	constructor(
		private ctx: Context
	) {
		this.logger = ctx.logger('note-core')
		this.database = ctx.database

		this.data = {}
	}
}