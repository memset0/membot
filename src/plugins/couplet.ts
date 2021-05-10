import * as request from 'superagent';

const apiRoot = 'https://ai-backend.binwang.me/chat/couplet/';

module.exports = (ctx) => {
	ctx.command('couplet <text>')
		.action(async (_, text) => {
			const res = await request.get(apiRoot + encodeURIComponent(text));
			if (res.status !== 200) {
				return 'API 返回异常：Code ' + res.status;
			}

			return res.body.output;
		});
};