const fs = require('fs')
const path = require('path')
const YAML = require('yaml')
const config = require('./src/config').default


const i18nLocaleFile = path.join(__dirname, './src/i18n-patch.yml')
const i18nLocale = YAML.parse(fs.readFileSync(i18nLocaleFile).toString())
config.plugins ||= {}
config.plugins.locales ||= {}
config.plugins.locales.i18n = {
	...i18nLocale,
	...(config.plugins.locales.i18n || {}),
}


module.exports = {
	...config.options,
	nickname: config.nickname,
	minSimilarity: 0,
	autoAuthorize: (ses) => (ses.groupId ? 1 : 0),

	watch: config.watch ? {
		root: 'src',
		ignore: [],
	} : {},

	plugins: {
		'database-mysql': config.mysql,
		'adapter-onebot': { ...config.bots.onebot[0] },
		'adapter-kook': { ...config.bots.kook[0] },

		help: {
			options: false,
			shortcut: false,
		},
		'rate-limit': {},
		console: {
			// open: true,
		},
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

const pluginDirs = []
const scanDir = (dir) => fs.readdirSync(dir).map(subdir => path.join(dir, subdir))
pluginDirs.push.apply(pluginDirs, scanDir(path.join(__dirname, './src/plugins')))
pluginDirs.push.apply(pluginDirs, scanDir(path.join(__dirname, './src/commands')))
for (const dir of pluginDirs) {
	const name = path.basename(dir, path.extname(path.basename(dir)))
	if (name == '_scoped') continue
	module.exports.plugins['./' + path.relative(__dirname, dir)] = config.plugins[name]
}