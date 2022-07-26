import { Context } from 'koishi'

import * as character from './character'

export const name = 'bot'

export function apply(ctx: Context) {
	ctx.command('wenyan', '文言文查询')
		.alias('wy')

		character.apply(ctx)
}