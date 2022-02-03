const fs = require('fs');
const path = require('path');
const config = require('./src/config').default;

module.exports = {
	nickname: config.nickname,
	...config.options,

	watch: config.watch ? {
		root: 'src',
		ignore: [],
	} : {},

	plugins: {
		'database-mysql': config.mysql,
		'adapter-onebot': { ...config.options.onebot, bots: config.bots.onebot },
		'adapter-kaiheila': { ...config.options.kaiheila, bots: config.bots.kaiheila },
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