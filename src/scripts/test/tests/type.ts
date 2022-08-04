import { Context } from 'koishi'
import assert from 'assert'

import { isInteger, isValidDate } from '../../../utils/type'

export const name = 'test-type'

export async function apply(ctx: Context) {
	const logger = ctx.logger(name)

	assert(isInteger(3))
	assert(isInteger(-3))
	assert(!isInteger(3.1))
	assert(!isInteger(1 / 0))

	assert(isValidDate(Date()))
	assert(isValidDate(Date.now()))
	assert(isValidDate(Date.parse(Date())))
	assert(isValidDate(new Date()))
	assert(isValidDate(new Date(Date())))
	assert(isValidDate(new Date(Date.now())))
	assert(isValidDate(new Date(new Date())))
	assert(!isValidDate(null))
	assert(!isValidDate(Date.parse(null)))
	assert(!isValidDate(Date.parse('xxx')))
	assert(!isValidDate(Date.parse('11-45-14 19:19:81.0')))
}