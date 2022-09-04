import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import config = require('../../koishi.config.js')
fs.writeFileSync(path.join(__dirname, '../../koishi.config.yml'), YAML.stringify(config))