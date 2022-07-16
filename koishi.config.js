const fs = require('fs');
const path = require('path');
const config = require('./src/config').default;

module.exports = {
	nickname: config.nickname,
	...config.options,

	// autoAuthorize: (ses) => {
	// 	console.log('auto auth', ses.userid)
	// 	if (ses.platform == 'onebot' && ses.userId == config.master.onebot) {
	// 		return 4;
	// 	}
	// 	return ses.groupId ? 1 : 0;
	// },

	watch: config.watch ? {
		root: 'src',
		ignore: [],
	} : {},

	plugins: {
		'database-mysql': config.mysql,
		'adapter-onebot': { ...config.bots.onebot[0] },
		'adapter-kook': { ...config.bots.kaiheila[0] },

		help: { options: false, shortcut: false },
		console: { open: true },
		logger: {},
		suggest: {},
		manager: {},
		status: {},
		sandbox: {},
	}
};

const pluginDirs = [];
const scanDir = (dir) => fs.readdirSync(dir).map(subdir => path.join(dir, subdir));
pluginDirs.push.apply(pluginDirs, scanDir(path.join(__dirname, './src/plugins')));
pluginDirs.push.apply(pluginDirs, scanDir(path.join(__dirname, './src/commands')));
for (const dir of pluginDirs) {
	const name = path.basename(dir, path.extname(path.basename(dir)));
	if (name == '_scoped') continue;
	module.exports.plugins['./' + path.relative(__dirname, dir)] = config.plugins[name];
}