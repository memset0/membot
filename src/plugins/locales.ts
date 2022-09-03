import { Context, Logger, I18n } from 'koishi'
import YAML from 'yaml'

export const name = 'locales'
export const logger = new Logger('locales')

export interface I18nDict {
	[command: string]: I18nDict | string
}

export interface Config {
	i18n: I18nDict
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

function defineI18n(ctx: Context, lang: string, data: I18nDict) {
	const dfs = (data: string | I18nDict, chain: string): void => {
		if (typeof data === 'string') {
			ctx.i18n._data[lang][chain] = data
		} else {
			for (const key in data) {
				dfs(data[key], chain + '.' + key)
			}
		}
	}
	for (const key in data) {
		dfs(data[key], key)
	}
}


export async function apply(ctx: Context, config: Config) {
	// logger.info(i18nToYaml(ctx.i18n._data['zh']))
	// ctx.app.i18n.define('zh', config.i18n)
	defineI18n(ctx, 'zh', config.i18n)
}