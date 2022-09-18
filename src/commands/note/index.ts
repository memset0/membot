import { Context, Time, segment } from 'koishi'
import YAML from 'yaml'
import { cloneDeep } from 'lodash'
import MarkdownIt from 'markdown-it'

import { Note, NoteStatus, NoteUser, NoteMeta } from './note'
import renderStatus from './templates/status'

declare module 'koishi' {
	interface Channel {
		note: NoteUser
	}

	interface Tables {
		note: NoteMeta
	}
}

interface RecentMessage {
	[K: string]: Array<Array<segment.Parsed>>
}


export const name = 'note'
export const using = ['database'] as const

export function apply(ctx: Context) {
	ctx.template.register('note/status', renderStatus)
	const logger = ctx.logger('note')
	const core = new Note(ctx)
	const markdown = new MarkdownIt()
	const recentMessage: RecentMessage = {}

	function pushMessage(id: string, message: Array<segment.Parsed>): void {
		if (!recentMessage[id]) { recentMessage[id] = [] }
		recentMessage[id].push(message)
		if (recentMessage[id].length > 3) { recentMessage[id].splice(0, 1) }
	}

	function pullMessage(id: string): Array<Array<segment.Parsed>> {
		if (!recentMessage[id]) { return [] }
		const result = recentMessage[id]
		recentMessage[id] = null
		return result
	}

	ctx.model.extend('channel', {
		note: 'json',
	})

	ctx.model.extend('note', {
		id: 'unsigned',
		status: { type: 'unsigned', initial: NoteStatus.default },
		userId: 'string',
		channelId: 'string',
		content: 'string',
		time: 'timestamp',
		extend: { type: 'json', initial: {} },
	}, {
		autoInc: true,
	})

	ctx.on('ready', async () => {
		const channelDataList = await ctx.database.get('channel', {})
		for (const channelData of channelDataList) {
			if (channelData.note?.enabled) {
				core.addChannel(`${channelData.platform}:${channelData.id}`, channelData.note)
			}
		}
	})

	ctx.on('dispose', async () => {
		for (const channelId of Object.keys(core.data)) {
			core.deleteChannel(channelId)
		}
	})

	ctx.middleware((session, next) => {
		const channelId = `${session.platform}:${session.channelId}`
		if (channelId in core.data) {
			const userId = `${session.platform}:${session.userId}`
			pushMessage(`${channelId}:${userId}`, segment.parse(session.content))
		}
		return next()
	})

	ctx.command('note', '笔记本功能', { authority: 2 })
		.alias('n')
		.action(async ({ session }) => {
			return await session.execute('help note')
		})

	ctx.command('note.enable', '启用功能', { authority: 3 })
		.action(async ({ session }) => {
			const channel = await session.getChannel(session.channelId, ['note'])
			if (channel.note?.enabled) { return '笔记本功能已处于启用状态' }
			await ctx.database.setChannel(session.platform, session.channelId, { note: { enabled: true } })
			core.addChannel(`${session.platform}:${session.channelId}`, channel.note)
			return '成功启用笔记本功能'
		})

	ctx.command('note.disable', '禁用功能', { authority: 3 })
		.action(async ({ session }) => {
			const channel = await session.getChannel(session.channelId, ['note'])
			if (!channel.note?.enabled) { return '笔记本功能已处于禁用状态' }
			await ctx.database.setChannel(session.platform, session.channelId, { note: { enabled: false } })
			core.deleteChannel(`${session.platform}:${session.channelId}`)
			return '成功禁用笔记本功能'
		})

	ctx.command('note.status', '查看统计信息', { authority: 2 })
		.alias('note.stat')
		.alias('note.s')
		.alias('note.list')
		.alias('note.l')
		.option('channel', '-c <channel:string>')
		.option('forceEdit', '-f')
		.action(async ({ session, options }) => {
			const channelId = options.channel
				? (options.channel.includes(':')
					? options.channel
					: `${session.platform}:${options.channel}`)
				: `${session.platform}:${session.channelId}`
			if (!(channelId in core.data)) { return '未启用笔记本功能' }
			const editable = session.subtype === 'private' || options.forceEdit
			const notes = await core.fetchChannel(channelId)
			const url = ctx.web.register({
				session,
				cacheTime: Time.day,
				hash: {
					platform: session.platform,
					channelId: session.channelId,
					editable,
					// ids: notes.map(note => note.id)
				},
				data: {
					layout: 'note',
					cacheTime: Time.day,
					data: {
						editable,
						notes: async () => {
							const fetcher = core.fetchChannel.bind(core)
							const notes = await fetcher(channelId)
							for (const note of notes) { note.content = markdown.render(note.content) }
							return notes
						},
					},
					methods: {
					},
				},
			})
			return segment.quote(session.messageId) +
				ctx.template.render('note/status', {
					url,
					length: notes.length,
				})
		})

	ctx.command('note.add <content:text>', '添加笔记', { authority: 2 })
		.alias('note.a')
		.action(async ({ session }, content: string) => {
			const channelId = `${session.platform}:${session.channelId}`
			const userId = `${session.platform}:${session.userId}`
			if (!(channelId in core.data)) { return '未启用笔记本功能' }
			const recent = pullMessage(`${channelId}:${userId}`)
			let images = []
			for (const message of recent) {
				for (const seg of message) {
					if (seg.type === 'image' && seg.data.url) { images.push(seg.data.url) }
				}
			}
			if (images.length) {
				images = await Promise.all(images.map(image => ctx.image.upload(image)))
			}
			const note = await core.addNote(channelId, userId, content, { images })
			return `成功添加笔记 #${note.id}`
		})

	ctx.command('note.delete <id:number>', '删除笔记', { authority: 2 })
		.alias('note.d')
		.userFields(['authority'])
		.action(async ({ session }, id: number) => {
			const channelId = `${session.platform}:${session.channelId}`
			const userId = `${session.platform}:${session.userId}`
			if (!(channelId in core.data)) { return '未启用笔记本功能' }
			const note = await core.getNote(id)
			if (note?.channelId !== channelId) { return '笔记不存在' }
			if (note.userId !== userId) {
				if (session.user.authority < 4) { return '你不能删除别人的笔记' }
			}
			if (note.status === NoteStatus.deleted) { return '笔记已经被删除' }
			await core.deleteNote(channelId, userId, id, session.user.authority === 4)
			return '成功删除笔记'
		})
}