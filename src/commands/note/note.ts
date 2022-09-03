import { Context, Database, Logger } from 'koishi'
import assert from 'assert'

export interface NoteUser {
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

	addUser(userId: string, userdata: NoteUser): void {
		this.logger.info('add user', userId, userdata)
		this.data[userId] = userdata
	}

	deleteUser(userId: string): void {
		this.logger.info('delete user', userId)
		delete this.data[userId]
	}

	async fetchUser(userId: string): Promise<Array<NoteMeta>> {
		assert(userId in this.data)
		const result = await this.database.get('note', { userId: { $eq: userId } })
		this.logger.info('fetch user', userId, result)
		return result as Array<NoteMeta>
	}

	async addNote(userId: string, content: string) {
		assert(userId in this.data)
		await this.database.create('note', {
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