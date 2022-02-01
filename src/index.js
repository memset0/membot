const { App } = require('koishi');

const config = require('./config').default;
const app = new App(config.options);

app.options.nickname = config.nickname;

app.plugin('database-mysql', config.mysql);

app.plugin('adapter-onebot', { bots: config.bots.onebot });
app.plugin('adapter-kaiheila', { bots: config.bots.kaiheila });

app.using(['database'], (ctx) => {
	const plugins = LoadPlugins();
	for (const name in plugins) {
		// console.log('[load plugin]', name, Object.keys(config.plugins).includes(name));
		if (Object.keys(config.plugins).includes(name)) {
			ctx.plugin(plugins[name], config.plugins[name]);
		} else {
			ctx.plugin(plugins[name]);
		}
	}
})

console.log(app.options);
app.start();


function LoadPlugins() {
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
			logger.info('load plugin', name, 'from', dir);
			plugins[name] = plugin;
		}
	}

	return plugins;
}