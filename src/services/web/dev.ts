import { Context } from 'koishi'
import Koa from 'koa'

import koishiConfig = require('../../../koishi.config')
import { WebService } from './app'

const ctx = new Context()
const app = new Koa()
const config = koishiConfig.plugins['./src/services/web']

const web = new WebService(ctx, app, config)
