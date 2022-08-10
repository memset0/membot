import { Context } from 'koishi'
import fs from 'fs'
import path from 'path'
import shuffle from 'shuffle-array'


export interface ArticleKeyword {
	predicate: string   // 谓语
	subject: string     // 宾语
}

export interface Article extends ArticleKeyword {
	article: string
	length: number
}

export const ParagraphPrefix = decodeURIComponent('%E3%80%80%E3%80%80')
export const ResourceType = [
	'点题',
	'总结',
	'名言',
	'事例',
	'绪论引言',
	'提出分论点',
	'回证分论点',
	'论证分论点',
	'提出中心论点',
	'回扣中心论点',
	'绪论本论过渡句',
] as const


export class Writer {
	resourcePath: string
	templatePath: string
	template: Array<string>
	resource: {
		[type: string]: Array<string>
	}

	generate(keyword: ArticleKeyword): Article {
		const result = { ...keyword } as Article

		result.article = shuffle.pick(this.template)
		for (const type of ResourceType) {
			const regexp = new RegExp(`「${type}」`, 'g')
			let count = result.article.match(regexp).length
			const resource = shuffle.pick(this.resource[type], { picks: count + 1 })
			result.article = result.article.replace(regexp, () => resource[--count])
			console.log(type, count, resource, [result.article])
		}

		result.article = result.article
			.replace(/「主题谓语」/g, keyword.predicate)
			.replace(/「主题宾语」/g, keyword.subject)
		result.length = result.article.length
		result.article = result.article
			.split('\n')
			.map((s) => (ParagraphPrefix + s))
			.join('\n')
		return result
	}

	async initial(): Promise<void> {
		for (const type of ResourceType) {
			const file = path.join(this.resourcePath, `${type}.txt`)
			const text = (await fs.promises.readFile(file)).toString()
			this.resource[type] = text.split('\n').map((s) => s.trim())
		}
		for (const template of (await fs.promises.readdir(this.templatePath))) {
			const file = path.join(this.templatePath, template)
			const text = (await fs.promises.readFile(file)).toString()
			this.template.push(text)
		}
	}

	constructor() {
		this.resourcePath = path.join(__dirname, 'resource')
		this.templatePath = path.join(__dirname, 'template')
		this.template = []
		this.resource = {}
		this.initial()
	}
}


export const name = 'xiezuowen' as const

export function apply(ctx: Context) {
	const writer = new Writer()

	ctx.command('xiezuowen <主题谓语:string> <主题宾语:string>', '满分作文生成器')
		.alias('xzw')
		.usage([
			'确定主题主语和主题谓语，让本作文生成器为你写一篇满分作文吧',
			'（参考自 https://zuowen.jackjyq.com/）',
		].join('\n'))
		.action(({ session }, predicate, subject) => {
			if (!subject || !predicate) { return session.execute('help xiezuowen') }
			if (subject.length > 10 || predicate.length > 10) { return '你的主题是不是太长了捏' }
			const article = writer.generate({ predicate, subject })
			return [
				`您的作文写完啦，共 ${article.length} 字：`,
				`《${predicate}${subject}》`,
				article.article,
			].join('\n')
		})
}