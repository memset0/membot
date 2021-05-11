const fs = require('fs');
const path = require('path');

let plugins = {};
let names = fs.readdirSync(path.join(__dirname, './plugins'));

for (let name of names) {
	if (name.endsWith('.ts')) {
		name = name.slice(0, name.length - 3);
		plugins[name] = require(path.join(__dirname, './plugins', name)).default;
	} else {
		plugins[name] = require(path.join(__dirname, './plugins', name, './index.ts')).default;
	}
}

module.exports = plugins;