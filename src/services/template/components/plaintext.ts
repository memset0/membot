import { Time, Session, segment } from 'koishi'
import { TemplateService } from '../index'
import { WebService } from '../../web/index'

declare module 'koishi' {
	interface Context {
		web: WebService
	}
}

export type PlainTextData = string | {
	text: string
	title?: string
	session?: Session
}

export default function PlainText(data: PlainTextData, { app }: TemplateService): string {
	if (typeof data === 'string') { data = { text: data } }

	if (data.text.length > 1000) {
		const url = app.web.registerPage(null, 'components/plaintext', data, Time.minute * 5)
		return `内容过长，请访问：${url}（五分钟内有效）`
	}

	const title = (data.title ? (data.title + '\n') : '')

	if (data.session?.platform === 'telegram') {
		return segment('html') +
			title +
			'<pre><code>' +
			data.text +
			'</code></pre>'
	}

	return title + data.text
}