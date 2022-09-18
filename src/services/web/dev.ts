import { Context } from 'koishi'
import Koa from 'koa'

import koishiConfig = require('../../../koishi.config')
import { WebService } from './app'

const ctx = new Context()
const app = new Koa()
const config = koishiConfig.plugins['./src/services/web']

const web = new WebService(ctx, app, config)
web.register({
	route: 'test-note-1',
	data: {
		"layout": "note",
		"data": {
			"notes": [{
				"id": 21,
				"status": 1,
				"userId": "onebot:1470738407",
				"channelId": "onebot:private:1470738407",
				"content": "<p>with image</p>\n",
				"time": "2022-09-18T01:42:31.000Z",
				"extend": {
					"images": [
						"https://bot.memset0.cn/static/2022/09/18/63267786af92f.png",
						"https://static.memset0.cn/img/v5/2022/09/18/632697e9cce6a.png",
					]
				}
			}, {
				"id": 17,
				"status": 1,
				"userId": "onebot:1470738407",
				"channelId": "onebot:private:1470738407",
				"content": "<p>123</p>\n",
				"time": "2022-09-09T12:06:12.000Z",
				"extend": { "images": [] }
			}]
		},
		"methods": {},
		"channel": {
			"id": "private:1470738407",
			"name": "test-note",
			"avatar": "https://q.qlogo.cn/headimg_dl?dst_uin=1470738407&spec=640"
		}
	}
})