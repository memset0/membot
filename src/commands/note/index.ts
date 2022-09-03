import { Context } from 'koishi'
import { uniq } from 'lodash'
import YAML from 'yaml'

import { Note, NoteStatus, NoteUser, NoteMeta } from './note'

declare module 'koishi' {
	interface User {
		note_enabled: boolean
		note_config: NoteUser
	}

	interface Tables {
		note: NoteMeta
	}
}



export const name = 'note'
export const using = ['database'] as const

export function apply(ctx: Context) {
	const core = new Note(ctx)

	ctx.model.extend('user', {
		note_enabled: { type: 'boolean', initial: false },
		note_config: { type: 'json', initial: false },
	})

	ctx.model.extend('note', {
		id: 'unsigned',
		status: { type: 'unsigned', initial: NoteStatus.default },
		userId: 'string',
		content: 'string',
		extend: { type: 'json', initial: {} },
	}, {
		autoInc: true,
	})

	ctx.on('ready', async () => {
		const userdatas = await ctx.database.get('user', { note_enabled: { $eq: true } })
		const platforms = uniq(ctx.bots.map(bot => bot.platform))
		for (const userdata of userdatas) {
			for (const platform of platforms) {
				if (userdata[platform]) {
					core.addUser(`${platform}:${userdata[platform]}`, userdata.note_config)
				}
			}
		}
	})

	ctx.on('dispose', async () => {
		for (const userId of Object.keys(core.data)) {
			core.deleteUser(userId)
		}
	})

	ctx.command('note', '笔记本功能', { authority: 2 })
		.alias('n')
		.action(async ({ session }) => {
			return await session.execute('help note')
		})

	ctx.command('note.enable', '启用功能', { authority: 2 })
		.userFields(['note_enabled', 'note_config'])
		.action(async ({ session }) => {
			if (session.user.note_enabled) { return '笔记本功能已处于启用状态' }
			session.user.note_enabled = true
			session.user.note_config = session.user.note_config || {}
			core.addUser(`${session.platform}:${session.userId}`, session.user.note_config)
			return '成功启用笔记本功能'
		})

	ctx.command('note.disable', '禁用功能', { authority: 2 })
		.userFields(['note_enabled', 'note_config'])
		.action(async ({ session }) => {
			if (!session.user.note_enabled) { return '笔记本功能已处于禁用状态' }
			session.user.note_enabled = false
			core.deleteUser(`${session.platform}:${session.userId}`)
			return '成功禁用笔记本功能'
		})

	ctx.command('note.status', '查看统计信息', { authority: 2 })
		.alias('note.stat')
		.action(async ({ session }) => {
			const userId = `${session.platform}:${session.userId}`
			if (!(userId in core.data)) { return '未启用笔记本功能' }
			const notes = await core.fetchUser(userId)
			return '统计信息'
		})

	ctx.command('note.add <content:text>', '添加笔记', { authority: 2 })
		.alias('note.a')
		.action(async ({ session }, content: string) => {
			const userId = `${session.platform}:${session.userId}`
			if (!(userId in core.data)) { return '未启用笔记本功能' }
			core.addNote(userId, content)
		})
}