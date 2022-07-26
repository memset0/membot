import { Context, Session } from 'koishi'
import * as request from 'superagent'

const apiRoot = 'https://ai-backend.binwang.me/chat/couplet/'

export default (ctx: Context) => {
	ctx.command('couplet <text>', '对对联')
		.action(async (_: any, text: string) => {
			const res = await request.get(apiRoot + encodeURIComponent(text))
			if (res.status !== 200) {
				return 'API 返回异常：Code ' + res.status
			}

			return res.body.output
		})
}