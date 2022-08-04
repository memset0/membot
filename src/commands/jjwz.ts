import { Context, Session, segment } from 'koishi'
import Koa from 'koa'

import { escapeCqCode, unescapeCqCode } from '../utils/string'
import * as Onebot from '../utils/onebot'

declare module 'koishi' {
	interface Tables {
		jjwz: JjwzMeta,
		jjwz_history: JjwzHistoryMeta,
	}
}

export interface JjwzMeta {
	id: number
	channel: string
	lengthLimit: number
	comboLimit: number
	owenowlMode: boolean
	article: Partial<Article>
}
export interface JjwzHistoryMeta extends JjwzMeta {
	time: Date
}


export const name = 'jjwz' as const
export const using = ['web', 'database'] as const

export default async function (ctx: Context) {
	const logger = ctx.logger(name)
	const config = {
		lengthLimit: 5,
		comboLimit: 1,
	}

	function at(session: Session): string {
		if (session.platform === 'telegram') {
			return segment.at(session.author.username || session.author.nickname || session.author.userId)
		}
		return segment.at(session.author.userId)
	}

	async function query(channel: string): Promise<JjwzMeta | null> {
		const res = await ctx.database.get('jjwz', { channel })
		if (!res?.length) { return null }
		const article = typeof res[0].article === 'string' ? JSON.parse(res[0].article) : res[0].article
		const meta = {
			...res[0],
			id: res[0].id,
			channel,
			article: new Article(channel, article.title || '', article.data || [])
		}
		logger.info('query', channel, '=>', meta)
		return meta
	}

	async function sync(meta: JjwzMeta, articleOnly: boolean = true): Promise<void> {
		await ctx.database.set('jjwz', { channel: meta.channel }, { article: meta.article })
	}

	ctx.model.extend('jjwz', {
		id: 'unsigned',
		channel: 'string',
		lengthLimit: 'unsigned',
		comboLimit: 'unsigned',
		owenowlMode: 'boolean',
		article: 'json',
	}, {
		autoInc: true,
	})

	ctx.model.extend('jjwz_history', {
		id: 'unsigned',
		time: 'timestamp',
		channel: 'string',
		lengthLimit: 'unsigned',
		comboLimit: 'unsigned',
		article: 'json',
	}, {
		autoInc: true,
	})

	ctx.middleware(async (session: Session, next: () => void) => {
		const meta = await query(`${session.platform}:${session.channelId}`)
		if (!meta) { return next() }
		if (session.content.startsWith('绝句 ')) { return session.execute('jjwz.add ' + session.content.slice(3)) }
		if (session.content.startsWith('绝句文章 ')) { return session.execute('jjwz.new ' + session.content.slice(5)) }
		if (session.content === '删除绝句') { return session.execute('jjwz.del') }
		if (meta.owenowlMode) {
			if (session.content.startsWith('add ')) { return session.execute('jjwz.add ' + session.content.slice(4)) }
			if (session.content.startsWith('edit ')) { return session.execute('jjwz.edit ' + session.content.slice(5)) }
			if (session.content.startsWith('end nosave ')) { return session.execute('jjwz.end --nosave ' + session.content.slice(11)) }
			if (session.content.startsWith('end ')) { return session.execute('jjwz.end ' + session.content.slice(4)) }
			if (session.content === 'undo end') { return session.execute('jjwz.revert') }
			if (session.content === 'undo') { return session.execute('jjwz.del') }
			if (session.content === 'show') { return session.execute('jjwz.show') }
		}
		return next()
	}, true)

	ctx.command('jjwz', '绝句文章 [高级功能]')
		.usage(['可用的前缀有：',
			'    绝句文章 <首句>：新建绝句文章',
			'    绝句 <绝句>：添加绝句',
			'    删除绝句：删除绝句',
			'    打开 OwenOwl 模式以使用更多前缀指令'].join('\n'))

	ctx.command('jjwz.add <sentence:string>', '添加绝句')
		.action(async ({ session }, sentence: string) => {
			const meta = await query(`${session.platform}:${session.channelId}`)
			if (!meta) { return '肥肠抱歉，你群并未开启绝句文章功能' }
			if (!sentence) { return session.execute('help jjwz.add') }
			sentence = unescapeCqCode(sentence)
			if (meta.article.end()) { return '纳尼，你群尚无在写绝句文章！' }
			if (sentence.length > meta.lengthLimit) { return '啊咧咧，你这也太长了吧' }
			if (meta.article.countBack(session.userId) >= meta.comboLimit) { return '别写了别写了，换别人来写两句' }
			meta.article.data.push({
				author: session.author.userId,
				content: sentence,
			})
			await sync(meta)
			return at(session) + '续写成功，当前：\n' + meta.article.toMessage()
		})

	ctx.command('jjwz.del', '删除绝句')
		.option('force', '-f 强制修改')
		.action(async ({ session, options }) => {
			const meta = await query(`${session.platform}:${session.channelId}`)
			if (!meta) { return '肥肠抱歉，你群并未开启绝句文章功能' }
			if (meta.article.end()) { return '纳尼，你群尚无在写绝句文章！' }
			if (!meta.article.countBack(session.userId)) {
				if (!Object.keys(options).includes('force')) { return '我寻思刚也不是你写的你删什么呢' }
				await session.send('你们可都看见了啊，是' + at(session) + '叫我删的')
			}
			meta.article.data.pop()
			await sync(meta)
			return at(session) + '删除成功，当前：\n' + meta.article.toMessage()
		})

	ctx.command('jjwz.edit <sentence:string>', '修改绝句')
		.option('force', '-f 强制修改')
		.action(async ({ session, options }, sentence: string) => {
			const meta = await query(`${session.platform}:${session.channelId}`)
			if (!meta) { return '肥肠抱歉，你群并未开启绝句文章功能' }
			if (!sentence) { return session.execute('help jjwz.edit') }
			sentence = unescapeCqCode(sentence)
			if (meta.article.end()) { return '纳尼，你群尚无在写绝句文章！' }
			if (!meta.article.countBack(session.userId)) {
				if (!Object.keys(options).includes('force')) { return '我寻思刚也不是你写的你改什么呢' }
				await session.send('你们可都看见了啊，是' + at(session) + '叫我改的')
			}
			meta.article.back().content = sentence
			await sync(meta)
			return at(session) + '修改成功，当前：\n' + meta.article.toMessage()
		})

	ctx.command('jjwz.new <sentence:string>', '新建绝句文章')
		.action(async ({ session }, sentence: string) => {
			const meta = await query(`${session.platform}:${session.channelId}`)
			if (!meta) { return '肥肠抱歉，你群并未开启绝句文章功能' }
			if (!meta.article.end()) { return '绝句文章在写中哦' }
			meta.article.title = ''
			meta.article.data = []
			if (sentence) { meta.article.data.push({ author: session.author.userId, content: sentence }) }
			await sync(meta)
			return at(session) + '新建成功，当前：\n' + meta.article.toMessage()
		})

	ctx.command('jjwz.end <title:string>', '结束绝句文章')
		.option('nosave', '不保存到历史记录中')
		.action(async ({ session, options }, title: string) => {
			const meta = await query(`${session.platform}:${session.channelId}`)
			if (!meta) { return '肥肠抱歉，你群并未开启绝句文章功能' }
			if (!title) { return '大侠，请一定要留个标题啊！' }
			if (meta.article.end()) { return '纳尼，你群尚无在写绝句文章！' }
			meta.article.title = title
			await sync(meta)
			if (!options.nosave) {
				const history = meta as JjwzHistoryMeta
				delete history.id
				history.time = new Date()
				await ctx.database.create('jjwz_history', history)
			}
			return meta.article.toMessage()
		})

	ctx.command('jjwz.revert', '恢复已经结束的绝句文章')
		.action(async ({ session }) => {
			const meta = await query(`${session.platform}:${session.channelId}`)
			if (!meta) { return '肥肠抱歉，你群并未开启绝句文章功能' }
			if (!meta.article.title) { return '纳尼，你群尚无写完的绝句文章！' }
			meta.article.title = ''
			await sync(meta)
			return at(session) + '恢复成功，当前：\n' + meta.article.toMessage()
		})

	ctx.command('jjwz.show', '展示当前绝句文章')
		.action(async ({ session }) => {
			const meta = await query(`${session.platform}:${session.channelId}`)
			if (!meta) { return '肥肠抱歉，你群并未开启绝句文章功能' }
			if (!meta.article.data.length) { return '纳尼，你群尚无在写绝句文章！' }
			return at(session) + '当前：\n' + meta.article.toMessage()
		})

	ctx.command('jjwz.enable', '启用绝句文章功能', { authority: 3 })
		.action(async ({ session }) => {
			const meta = await query(`${session.platform}:${session.channelId}`)
			if (meta) { return '你群已经启用绝句文章功能咧' }
			await ctx.database.create('jjwz', {
				channel: `${session.platform}:${session.channelId}`,
				lengthLimit: config.lengthLimit,
				comboLimit: config.comboLimit,
				owenowlMode: false,
				article: { title: '', data: [] },
			})
			return '成功启用绝句文章！'
		})

	ctx.command('jjwz.disable', '禁用绝句文章功能', { authority: 3 })
		.action(async ({ session }) => {
			const meta = await query(`${session.platform}:${session.channelId}`)
			if (!meta) { return '你群还未启用绝句文章功能咧' }
			await ctx.database.remove('jjwz', {
				channel: `${session.platform}:${session.channelId}`,
			})
			return '成功禁用绝句文章！'
		})

	ctx.command('jjwz.config <lengthLimit:number> <comboLimit:number> <owenowlMode:boolean>', '修改绝句文章设置', { authority: 3 })
		.action(async ({ session }, lengthLimit: number, comboLimit: number, owenowlMode: boolean) => {
			const meta = await query(`${session.platform}:${session.channelId}`)
			if (!meta) { return '你群还未启用绝句文章功能咧' }
			if (lengthLimit < 0 || comboLimit < 0 || isNaN(lengthLimit) || isNaN(comboLimit)) { return '这样设置可是不行的哦' }
			await ctx.database.set('jjwz', { channel: `${session.platform}:${session.channelId}` }, { comboLimit, lengthLimit, owenowlMode })
			return `更新成功！当前规则：每个人可以连续添加 ${comboLimit} 条绝句，每条绝句的长度限制为 ${lengthLimit}。${owenowlMode ? 'OwenOwl 模式已启用！' : ''}`
		})

	ctx.command('jjwz.status', '查询本群绝句文章统计')
		.alias('jjwz.stat')
		.action(async ({ session }) => {
			const meta = await query(`${session.platform}:${session.channelId}`)
			if (!meta) { return '你群还未启用绝句文章功能咧' }
			const history = await ctx.database.get('jjwz_history', {
				channel: `${session.platform}:${session.channelId}`
			})
			const userInfo = {}
			if (session.platform === 'onebot') {
				const memberList = await session.bot.internal.getGroupMemberList(session.channelId)
				for (const member of memberList) {
					userInfo[String(member.user_id)] = {
						username: member.nickname,
						avatar: Onebot.getAvatarUrl(member.user_id),
					}
				}
			}
			const url = ctx.web.registerPage({
				platform: session.platform,
				channelId: session.channelId,
				lengthLimit: meta.lengthLimit,
				comboLimit: meta.comboLimit,
				owenowlMode: meta.owenowlMode,
				historyLength: history.length,
			}, 'jjwz', {
				title: `绝句文章`,
				history,
				data: meta,
				channelName: session.channelName,
				renderUser: (userId: string) => {
					if (userId in userInfo) {
						return `<img class='ui avatar image' src='${userInfo[userId].avatar}'> <span>${userInfo[userId].username}</span>`
					} else {
						return `<span>${userId}</span>`
					}
				},
			})
			return [
				`当前规则：每个人可以连续添加 ${meta.comboLimit} 条绝句，每条绝句的长度限制为 ${meta.lengthLimit}。${meta.owenowlMode ? 'OwenOwl 模式已启用！' : ''}`,
				`本群已写了 ${history.length} 篇绝句文章，前往 ${url} 查看历史记录。`,
			].join('\n')
		})
}


export interface Sentence {
	author: string
	content: string
}

export class Article {
	channel: string
	title: string
	data: Array<Sentence>

	end(): boolean { return !!(this.title || this.data.length === 0) }
	back(): Sentence { return this.data[this.data.length - 1] }

	reset() {
		this.channel = ''
		this.title = ''
		this.data = []
	}

	count(author: string): number {
		let count = 0
		for (const sentence of this.data) {
			if (sentence.author === author) { count += 1 }
		}
		return count
	}

	countBack(author: string): number {
		let count = 0
		for (let i = this.data.length - 1; i >= 0; i--) {
			if (this.data[i].author === author) {
				count += 1
			} else {
				break
			}
		}
		return count
	}

	toMessage(): string {
		let rsp = ''
		if (this.title) { rsp += '《' + this.title + '》\n' }
		for (const sentence of this.data) { rsp += sentence.content }
		// if (!this.title) { rsp += ' ...' }
		return escapeCqCode(rsp)
	}

	constructor(channel: string, title: string, data: Array<Sentence>) {
		this.channel = channel
		this.title = title
		this.data = data
	}
}