import { App, Context, Session } from 'koishi'
import { merge } from 'lodash'

import renderColumn from './components/column'
import renderPlainText from './components/plaintext'

declare module 'koishi' {
	interface Context {
		template: TemplateService
	}
}


export interface Config { }

export type RenderFunction = (data: any, service?: TemplateService) => string


export const name = 'template' as const
// export const using = ['web'] as const

export function apply(ctx: Context, config: Config) {
	Context.service('template')
	ctx.app.template = new TemplateService(ctx, config)
}


export class TemplateService {
	Column: RenderFunction = this.bind(renderColumn)
	PlainText: RenderFunction = this.bind(renderPlainText)

	app: App
	data: { [K: string]: RenderFunction }

	bind(func: RenderFunction): RenderFunction {
		return (data: any): string => func(data, this)
	}

	register(name: string, func: RenderFunction): void {
		this.data[name] = func
	}

	render(name: string, data: any): string {
		return this.data[name](data, this)
	}

	constructor(
		private ctx: Context,
		private config: Config,
	) {
		this.data = {}
		this.app = ctx.app
	}
}