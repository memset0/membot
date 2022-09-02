import { Context, Session } from 'koishi'
import { merge } from 'lodash'

import renderColumn from './components/column'

declare module 'koishi' {
	interface Context {
		template: TemplateService
	}
}

export interface Config {
}

export type RenderFunction = (data: any, template?: Template) => string

export interface Template {
	[K: string]: any
	session?: Session

	Column: RenderFunction,
}



export const name = 'template' as const

export function apply(ctx: Context, config: Config) {
	Context.service('template')
	ctx.app.template = new TemplateService(ctx, config)
}



export class TemplateService {
	args: Template
	data: { [K: string]: RenderFunction }

	register(name: string, func: RenderFunction): void {
		this.data[name] = func
	}

	render(name: string, data: any, session?: Session): string {
		if (session) {
			return this.data[name](data, merge(this.args, { session }))
		} else {
			return this.data[name](data, this.args)
		}
	}

	constructor(
		private ctx: Context,
		private config: Config,
	) {
		this.data = {}
		this.args = {
			Column: renderColumn,
		}
	}
}