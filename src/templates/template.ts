import { Logger } from 'koishi'

const logger = new Logger('template')

export class Template {
	static applyFilter(data: any, filter: (string) => string): any {
		if (typeof data === 'string') { return filter(data) }
		for (const key in data) {
			data[key] = this.applyFilter(data[key], filter)
		}
		return data
	}

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