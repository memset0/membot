import { segment, Context, Logger } from 'koishi'
import config from '../../config'


export const name = 'auth'
export const using = ['database']

export const logger = new Logger('plugin-trilium')


export async function apply(ctx: Context) {
	const db = ctx.database

	ctx.command('trilium', 'Trilium 笔记本相关功能', { authority: 3 })

	ctx.command('trilium.register <server> <apiKey> <noteId>', '注册 trilium 功能钩子', { authority: 3 })
		.userFields(['authority'])
		.action(async ({ session }, server, apiKey, noteId) => {
			const platform = session.platform
			const userId = session.user['id']
			const user = await db.getUser(platform, userId)

			const triliumData = { server, apiKey, noteId }
			logger.info('register', userId, triliumData)

			try {
				// await db.setUser(platform, userId, { trilium: triliumData })
			} catch (err) {
				return '注册失败：' + JSON.stringify(err)
			}
			return '注册成功'
		})
}