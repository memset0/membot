const fs = require('fs');
const path = require('path');

let plugins = [];
let names = fs.readdirSync(path.join(__dirname, './plugins'));

for (let name of names) {
	if (name.endsWith('.ts')) {
		plugins.push(require(path.join(__dirname, './plugins', name)).default);
	} else {
		plugins.push(require(path.join(__dirname, './plugins', name, './index.ts')).default);
	}
}

module.exports = plugins;