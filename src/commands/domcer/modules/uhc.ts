import { Context } from 'koishi'

import { Checker } from '../checker'
import { getJSON } from '../api'
import { codeErrorMessage } from '../utils'


export function apply(ctx: Context) {
	ctx.command('domcer.uhc <username>', '查询 UHC 数据')
		.alias('domcer.buhc')
		.check((_, name) => Checker.isUserName(name))
		.action(async ({ session }, name) => {
			if (!name) { return session.execute('help domcer.uhc') }
			let data = await getJSON('/player/getByName', { name })
			if (data.status !== 200) { return codeErrorMessage(data.status) }

			const uuid = data.data.uuid
			data = await getJSON('/stats/getStats', { uuid, statsName: 'UHC' })
			if (data.status !== 200) { return codeErrorMessage(data.status) }

			session.send([
				`${name} 的 UHC 数据`,
				`【硬币】${data.data.coins}`,
				`【组队模式击杀】${data.data.teamKills}【死亡】${data.data.teamDeath}【KD 比】${(data.data.teamKills / data.data.teamDeath).toFixed(4)}`,
				`【组队模式获胜】${data.data.teamWins}【场次】${data.data.teamGames}【获胜率】${(data.data.teamWins / data.data.teamGames * 100).toFixed(2)}%`,
			].join('\n'))
		})
}