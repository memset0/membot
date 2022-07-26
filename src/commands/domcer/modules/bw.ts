import { Context } from 'koishi'

import { Checker } from '../checker'
import { getJSON } from '../api'
import { codeErrorMessage } from '../utils'


export function apply(ctx: Context) {
	ctx.command('domcer.bw <username>', '查询起床战争数据')
		.alias('domcer.bedwar')
		.alias('domcer.bedwars')
		.check((_, name) => Checker.isUserName(name))
		.action(async ({ session }, name) => {
			if (!name) return session.execute('help domcer.bw')
			let data = await getJSON('/player/getByName', { name })
			if (data.status !== 200) { return codeErrorMessage(data.status) }

			const uuid = data.data.uuid
			data = await getJSON('/stats/getStats', { uuid, statsName: 'BedWars' })
			if (data.status !== 200) { return codeErrorMessage(data.status) }

			session.send([
				`${name} 的起床战争数据`,
				`【硬币】${data.data.coins}【奖励箱】${data.data.chest}【等级】${data.data.level}【经验】${data.data.xp}`,
				`【总摧毁床数】${data.data.bedDestroyed}【总被摧毁床数】${data.data.bedBeenDestroyed}`,
				`【总获胜场次】${data.data.wins}【总局数】${data.data.games}【获胜率】${(data.data.wins / data.data.games * 100).toFixed(2)}%`,
				`【总击杀】${data.data.kills}【总死亡】${data.data.deaths}【KD 比】${(data.data.kills / data.data.deaths).toFixed(4)}`,
				`【总最终击杀】${data.data.finalKills}【总最终死亡】${data.data.finalDeaths}【Final KD比】${(data.data.finalKills / data.data.finalDeaths).toFixed(4)}`,
			].join('\n'))
		})
}