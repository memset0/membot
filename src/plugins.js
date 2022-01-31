const fs = require('fs');
const path = require('path');

const logger = new (require('koishi').Logger)('plugin');

function scanDir(dir) {
	return fs.readdirSync(dir).map(subdir => path.join(dir, subdir));
}

let plugins = {};
let dirs = [];
dirs.push.apply(dirs, scanDir(path.join(__dirname, './plugins')));
dirs.push.apply(dirs, scanDir(path.join(__dirname, './commands')));

for (let dir of dirs) {
	let name = path.basename(dir);
	if (name == '_scoped') {
		continue;
	}

	let plugin;
	if (name.endsWith('.ts')) {
		name = name.slice(0, name.length - 3);
		plugin = require(path.join(path.dirname(dir), name)).default
	} else {
		plugin = require(path.join(path.dirname(dir), name, './index.ts')).default;
	}

	if (plugin) {
		logger.info('Load Plugin', name, 'from', dir);
		plugins[name] = plugin;
	}
}

module.exports = plugins;