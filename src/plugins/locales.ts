import { Context, Logger, I18n } from 'koishi'
import YAML from 'yaml'

export const name = 'locales'
export const logger = new Logger('locales')

export interface Config {
	i18n: {
		[command: string]: string
	}
	commands: any
}


function i18nToYaml(data: I18n.Store) {
	const parsed = {}
	for (const key in data) {
		const subkeys = key.split('.')
		let current = parsed
		for (const i in subkeys) {
			const subkey = subkeys[i]
			if (parseInt(i) === subkeys.length - 1) {
				current[subkey] = data[key]
				logger.info(key, subkey, data[key], current)
			} else {
				current[subkey] ||= {}
				current = current[subkey]
			}
		}
	}

	return YAML.stringify(parsed)
}


export async function apply(ctx: Context, config: Config) {
	// logger.info(i18nToYaml(ctx.i18n._data['zh']))
	ctx.app.i18n.define('zh', config.i18n)
}