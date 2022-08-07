import { Logger } from 'koishi'
import fs from 'fs'
import path from 'path'

class VersionController {
	loaded: boolean
	logger: Logger

	app: string
	koishi: string


	async init() {
		const packageInfo = JSON.parse((await fs.promises.readFile(path.join(__dirname, '../../package.json'))).toString())
		this.app = packageInfo.version
		this.koishi = packageInfo.dependencies.koishi.replace(/^\^/, '')
	}

	constructor() {
		this.logger = new Logger('utils-version')
		this.init()
			.then(() => {
				this.loaded = true
				this.logger.info({ app: this.app, koishi: this.koishi })
			})
	}
}

export const version = new VersionController()