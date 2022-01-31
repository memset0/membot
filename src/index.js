const { App } = require('koishi');

const config = require('./config').default;
const appConfig = config.adapter;
const app = new App(appConfig);

app.plugin('database-mysql', config.mysql);

app.plugin('adapter-onebot', { bots: config.bots.onebot });
app.plugin('adapter-kaiheila', { bots: config.bots.kaiheila });

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
app.options.help = { hidden: true, shortcut: false };
app.start();