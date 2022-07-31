import { Logger } from 'koishi'

const logger = new Logger('template')

export class Template {
	toString(): string {
		logger.warn('`toString` method is not defined')
		return ''
	}

	constructor(data: any) {
		for (const key in data) {
			this[key] = data[key]
		}
	}
}