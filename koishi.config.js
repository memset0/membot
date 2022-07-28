const fs = require('fs')
const path = require('path')
const YAML = require('yaml')

/**
 * 引入配置文件
 */
const config = require('./config')

/**
 * 引入本地化补丁文件
 */
config.plugins.locales = {
	...(config.plugins?.locales || {}),
	i18n: {
		...require('./src/i18n-patch'),
		...(config.plugins?.locales?.i18n || {}),
	}
}

/**
 * 配置 koishi
 */
const koishi = {
	...config.options,

	watch: config.watch ? {
		root: 'src',
		ignore: [],
	} : {},

	plugins: {
		'database-mysql': config.mysql,
		'adapter-onebot': { ...config.bots.onebot[0] },
		'adapter-kook': { ...config.bots.kook[0] },
		// 'adapter-telegram': { ...config.bots.telegram[0] },
		'./src/adapters/telegram': { ...config.bots.telegram[0] },

		help: {
			options: false,
			shortcut: false,
		},
		'rate-limit': {},
		console: {
			// open: true,
		},
		// chat: {},
		recall: {},
		logger: {},
		suggest: {},
		status: {},
		sandbox: {},
		// manager: {},
		// puppeteer: {},
		// commands: {},   // not works
	}
}

/**
 * 扫描并载入本地插件
 */
const scan = (dir) => fs.readdirSync(dir).map(subdir => path.join(dir, subdir))
for (const dir of [
	...scan(path.join(__dirname, './src/plugins')),
	...scan(path.join(__dirname, './src/commands')),
]) {
	const name = path.basename(dir, path.extname(path.basename(dir)))
	if (name == '_scoped') {
		continue
	}
	const pluginPath = './' + path.relative(__dirname, dir).replace(/\\/g, '/')
	const pluginData = config.plugins[name] || {}
	koishi.plugins[pluginPath] = pluginData
}

/**
 * 应用全局变量
 */
const globals = {}
function expand(node, key = '') {
	if (key) {
		globals[key] = node
	}
	if (typeof node === 'object') {
		const prefix = key ? key + '.' : ''
		for (const i in node) {
			expand(node[i], prefix + i)
		}
	}
}
function walk(node) {
	for (const i in node) {
		if (typeof node[i] === 'string' &&
			node[i].startsWith('<') &&
			node[i].endsWith('>') &&
			Object.keys(globals).includes(node[i].slice(1, -1))
		) {
			node[i] = globals[node[i].slice(1, -1)]
		}
		if (typeof node[i] === 'object') {
			walk(node[i])
		}
	}
}
expand(config.globals)
walk(koishi)

module.exports = koishi