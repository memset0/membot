import { s, Context, Logger } from 'koishi';

import * as request from 'superagent';

export const logger = new Logger('command-wenyan-character');

export interface SearchResponse {
	success: boolean;
	message: string;
}

export async function searchByHwxnet(text): Promise<SearchResponse> {
	const apiFormat = 'https://wyw.hwxnet.com/search.do?wd=$1&x=0&y=0';
	const escapedText = encodeURIComponent(text);
	if (escapedText.length !== 9) {
		return { success: false, message: '请确认输入的是否为中文字符' };
	}

	try {
		const api = apiFormat.replace('$1', escapedText);

		let response = await request.get(api);
		if (response.text.indexOf('<!-- 分页信息 -->') !== -1) {
			// 说明当前的查询可能存在多个结果，需要手动跳转到结果页面。
			let targetUrl = response.text
				.split('<ul class="search_ul">', 2)[1]
				.split('</ul>', 2)[0]
				.split('<a href="', 2)[1]
				.split('"', 2)[0];
			
			logger.info(text, 'redirect to', targetUrl);
			response = await request.get(targetUrl);
		}

		let html = response.text
			.split('<div class="view_con clearfix">', 2)[1]
			.split('</div>', 2)[0];

		let result = html
			.replace(/^\s+|\s+$/gm, '')
			.replace(/\<br \/\>/g, '\n')
			.replace(/\<span .*?\>/g, '')
			.replace(/\<\/span\>/g, '');
		result = `“${text}”的文言文解释\n` + result;

		return { success: true, message: result };

	} catch (error) {
		logger.error(error);
		return { success: false, message: '查询失败，字典中可能没有收录当前单字' };
	}
}

export function apply(ctx: Context) {
	ctx.command('wenyan.char <value>', '文言字典查询')
		.alias('wenyan.zi')
		.alias('wenyan.character')
		.alias('wyzi')
		.alias('wychar')
		.action(async ({ session }, text) => {
			if (!text || text.length !== 1) {
				return session.execute('help wenyan.zi');
			}

			const res: SearchResponse = await searchByHwxnet(text);

			if (res.success) {
				return res.message;
			} else {
				return '查询失败：' + res.message;
			}
		});
}