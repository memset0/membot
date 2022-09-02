import { Context, Logger } from 'koishi'

import '../../utils/date'
import { initSpider, getJSON } from './api'

import * as commandMW from './modules/mw'
import * as commandBW from './modules/bw'
import * as commandUHC from './modules/uhc'

import renderMegawalls from './templates/megawalls'
import renderMegawallsRound from './templates/megawallsRound'



export const name = 'domcer'
export const using = ['template'] as const

export interface Config {
	root: string,
	key: string,
}


export async function apply(ctx: Context, config: Config) {
	initSpider(config.root, config.key)

	ctx.template.register('domcer/megawalls', renderMegawalls)
	ctx.template.register('domcer/megawallsRound', renderMegawallsRound)

	ctx.command('domcer', '查询 DoMCer 服务器数据', { hidden: true })

	commandBW.apply(ctx)
	commandMW.apply(ctx)
	commandUHC.apply(ctx)
}