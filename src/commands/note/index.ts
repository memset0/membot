import { Context, segment } from 'koishi'
import YAML from 'yaml'

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



export const name = 'note'
export const using = ['database'] as const

export function apply(ctx: Context) {
	ctx.template.register('note/status', renderStatus)
	const core = new Note(ctx)

	ctx.model.extend('channel', {
		note: 'json',
	})

	ctx.model.extend('note', {
		id: 'unsigned',
		status: { type: 'unsigned', initial: NoteStatus.default },
		userId: 'string',
		channelId: 'string',
		content: 'string',
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
		.action(async ({ session }) => {
			const channelId = `${session.platform}:${session.channelId}`
			if (!(channelId in core.data)) { return '未启用笔记本功能' }
			const notes = await core.fetchChannel(channelId)
			return (session.subtype === 'private' ? '' : (segment.at(session.userId) + '\n')) +
				ctx.template.render('note/status', {
					length: notes.length,
				})
		})

	ctx.command('note.add <content:text>', '添加笔记', { authority: 2 })
		.alias('note.a')
		.action(async ({ session }, content: string) => {
			const channelId = `${session.platform}:${session.channelId}`
			const userId = `${session.platform}:${session.userId}`
			if (!(channelId in core.data)) { return '未启用笔记本功能' }
			core.addNote(channelId, userId, content)
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