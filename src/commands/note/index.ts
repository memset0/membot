import { Context } from 'koishi'
import { uniq } from 'lodash'
import YAML from 'yaml'

import { Note, NoteStatus, NoteUser, NoteMeta } from './note'

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
		.action(async ({ session }) => {
			const channelId = `${session.platform}:${session.channelId}`
			if (!(channelId in core.data)) { return '未启用笔记本功能' }
			const notes = await core.fetchChannel(channelId)
			return '统计信息'
		})

	ctx.command('note.add <content:text>', '添加笔记', { authority: 2 })
		.alias('note.a')
		.action(async ({ session }, content: string) => {
			const channelId = `${session.platform}:${session.channelId}`
			const userId = `${session.platform}:${session.userId}`
			if (!(channelId in core.data)) { return '未启用笔记本功能' }
			core.addNote(channelId, userId, content)
		})
}