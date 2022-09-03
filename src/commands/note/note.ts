import { Context, Database, Logger } from 'koishi'
import assert from 'assert'

export interface NoteUser {
	enabled: boolean
}

export interface NoteExtend {
	images?: Array<string>
}

export enum NoteStatus {
	deleted,
	default,
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
		console.log(channelId, this)
		// assert(channelId in this.data)
		const result = await this.database.get('note', { channelId, status: { $gt: NoteStatus.deleted } })
		this.logger.info('fetch channel', channelId, result)
		return result as Array<NoteMeta>
	}

	async addNote(channelId: string, userId: string, content: string, extend?: NoteExtend): Promise<NoteMeta> {
		assert(channelId in this.data)
		this.logger.info('add note', channelId, userId, { content, ...extend })
		return await this.database.create('note', {
			channelId,
			userId,
			content,
			extend: extend || {},
		} as NoteMeta)
	}

	async getNote(id: number): Promise<NoteMeta | null> {
		return ((await this.database.get('note', { id })) as Array<NoteMeta>)[0] || null
	}

	async deleteNote(channelId: string, userId: string, id: number, force?: boolean) {
		const note = await this.getNote(id)
		assert(channelId in this.data && channelId === note.channelId)
		assert(force || userId === note.userId)
		await this.database.set('note', { id }, { status: NoteStatus.deleted })
	}

	constructor(
		private ctx: Context
	) {
		this.logger = ctx.logger('note-core')
		this.database = ctx.database

		this.data = {}
	}
}