import { segment, Session, Context, Logger } from 'koishi';
import * as cheerio from 'cheerio';
import * as request from 'superagent';

export const name = 'zdic';
export const logger = new Logger('command-zdic');

interface DataSection {
	title?: string,
	$: cheerio.Cheerio,
}

interface DataExplain {
	pronunciation?: string,
	meaning?: string[],
}


export const QUAD = decodeURI('%E3%80%80');   // 全角空格
export const apiRoot = 'https://www.zdic.net/hans/';

export function apply(ctx: Context) {
	ctx.command('zdic <word:text>', '汉典查询')
		.action(async ({ session: Session }, word) => {
			if (word.includes('/') || word.includes('&') || word.includes('?') || word.includes('\\') || word.includes('.') || word.includes(';') || word.includes('%')) {
				return '输入不合法';
			}

			const url = apiRoot + encodeURIComponent(word);
			const footer = '\n来源：' + url;

			let text = null, $ = null;
			try {
				text = (await request.get(url)).text;
				$ = cheerio.load(text);
			} catch (error) {
				if (error.mesasage) {
					return '请求错误：' + error.message;
				} else {
					return '请求错误';
				}
			}

			if ($('title').text() == '查无此结果') {
				return '查无此结果';
			}

			if ($('title').text() == '全站搜索') {
				// 同样是查询不到，但是会自动跳转到全站搜索。
				return '查无此结果';
			}

			let result = '';
			for (const section of $('.nr-box')) {
				const title = $(section).attr('data-type-block');

				if (word.length == 1 && title == '基本解释') {
					result += HanziSolve(section);
				}
			}

			if (!result) {
				result = '查询到结果但无可解析内容，请访问网站查看。';
			}
			return result + footer;


			function HanziSolve(section: Element): string {
				let result = '';
				result += '【汉典·汉字释义】' + word + '\n';

				const data: DataExplain[] = [];
				for (const line of $(section).children('.content').children()) {
					const text = $(line).text().trim();
					const tagName = $(line).prop('tagName');
					if (tagName == 'P') {
						if (text == '基本字义' || text == '其它字义') { continue; }
						console.log(text);
						if (text == '● ' + word) {
							data.push({ meaning: [] });
						} else if (data.length && !data[data.length - 1].pronunciation) {
							data[data.length - 1].pronunciation = text.split(/\s/)[0];
						} else if (data.length) {
							data[data.length - 1].meaning.push(text.replace(/^[◎●\s]*/, '').replace(/ /g, ''));
						}
					} else if (tagName == 'OL') {
						if (!text) { continue; }
						for (const meaning of $(line).children()) {
							data[data.length - 1].meaning.push($(meaning).text().replace(/ /g, ''));
						}
					}
				}

				for (const section of data) {
					if (data.length == 1) {
						result = result.slice(0, -1) + QUAD;
					} else {
						result += '● ';
					}
					result += section.pronunciation;

					if (section.meaning.length == 1) {
						result += QUAD + section.meaning[0];
					} else if (section.meaning.length > 1) {
						result += '\n';
						for (let i = 0; i < section.meaning.length; i++) {
							result += QUAD + String(i + 1) + ')' + QUAD + section.meaning[i] + '\n';
						}
						result = result.slice(0, -1);
					}
					result += '\n';
				}

				result = result.slice(0, -1);
				return result;
			}
		});
}