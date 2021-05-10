const { App } = require('koishi');

require('koishi-adapter-onebot');
require('koishi-adapter-kaiheila');

const config = require('./config').default;
const appConfig = config.bots;
const app = new App(appConfig);

const plugins = require('./plugins');
plugins.forEach(plugin => app.plugin(plugin));

app.start();