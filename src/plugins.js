const fs = require('fs');
const path = require('path');

let plugins = {};
let names = fs.readdirSync(path.join(__dirname, './plugins'));

for (let name of names) {
	let plugin;
	if (name.endsWith('.ts')) {
		name = name.slice(0, name.length - 3);
		plugin = require(path.join(__dirname, './plugins', name)).default
	} else {
		plugin = require(path.join(__dirname, './plugins', name, './index.ts')).default;
	}

	if (plugin) {
		plugins[name] = plugin;
	}
}

module.exports = plugins;