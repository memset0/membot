const { App } = require('koishi');

const config = require('./config').default;
const app = new App(config.options);
app.options.nickname = config.nickname;
app.options.prefix = config.prefix;

app.plugin('database-mysql', config.mysql);

app.plugin('adapter-onebot', { bots: config.bots.onebot });
app.plugin('adapter-kaiheila', { bots: config.bots.kaiheila });

app.using(['database'], (ctx) => {
	const plugins = require('./plugins');
	for (const name in plugins) {
		// console.log('[load plugin]', name, Object.keys(config.plugins).includes(name));
		if (Object.keys(config.plugins).includes(name)) {
			ctx.plugin(plugins[name], config.plugins[name]);
		} else {
			ctx.plugin(plugins[name]);
		}
	}
})

app.start();