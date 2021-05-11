const { App } = require('koishi');

require('koishi-adapter-onebot');
require('koishi-adapter-kaiheila');

const config = require('./config').default;
const appConfig = config.bots;
const app = new App(appConfig);

app.plugin(require('koishi-plugin-mysql'), config.mysql);

const plugins = require('./plugins');
for (const name in plugins) {
	// console.log('[load plugin]', name, Object.keys(config.plugins).includes(name));
	if (Object.keys(config.plugins).includes(name)) {
		app.plugin(plugins[name], config.plugins[name]);
	} else {
		app.plugin(plugins[name]);
	}
}

app.options.nickname = config.nickname;
app.options.prefix = config.prefix;
app.start();