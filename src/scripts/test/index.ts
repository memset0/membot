import { Context } from 'koishi'
import assert from 'assert'
import process from 'process'

import * as feeder from './tests/feeder'


export const name = 'test'

export function apply(ctx: Context) {
	const logger = ctx.logger(name)

	if (process.env.NODE_ENV !== 'development') {
		logger.info('skipped')
		return
	}

	ctx.logger(name).info('test modules enabled!')

	// feeder.apply(ctx)
}