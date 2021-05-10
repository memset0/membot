const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const configPath = path.join(__dirname, '../config.yml');
const configContent = fs.readFileSync(configPath).toString();
const config = YAML.parse(configContent);

export default config;