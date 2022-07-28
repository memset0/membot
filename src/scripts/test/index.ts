import { Context } from 'koishi'
import assert from 'assert'
import process from 'process'

import { selectBotByPlatform } from '../../utils/koishi'


export const name = 'test'

export function apply(ctx: Context) {
	if (!process.env.development) {
		return
	}

	ctx.logger(name).info('test modules enabled!')


}