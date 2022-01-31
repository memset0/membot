const { App } = require('koishi');

const config = require('./config').default;
const appConfig = config.adapter;
const app = new App(appConfig);

app.plugin('database-mysql', config.mysql);

app.plugin('adapter-onebot', { bots: config.bots.onebot });
app.plugin('adapter-kaiheila', { bots: config.bots.kaiheila });

app.middleware((session, next) => {
	if (session.platform == 'onebot' && session.type == 'message' &&
		(session.subtype == 'private' || !session.guildId || !session.channelId)) {
		// 由于风控等原因，qq 平台发送的私聊回话消息等应拒绝回复。
	} else {
		return next();
	}
}, true);

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