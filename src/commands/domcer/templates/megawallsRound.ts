export default function (data: any, { Column }): string {
	const res = []

	res.push(`超级战墙对局 ${data.id} / ${data.mapName} / ${data.mode}`)
	res.push(Column({ '时间': data.time.toChineseString() }))

	const round = {}
	if (data.winner) {
		round['获胜队伍'] = data.winner + '队'
		if (data.mvp) {
			round['MVP'] = data.mvp
		}
	}
	if (Object.keys(round).length) { res.push(Column(round)) }

	if (data.finals.length) {
		res.push(Column({ '最终击杀排行榜': '' }))
		for (let i = 0; i < Math.min(5, data.finals.length); i++) {
			const player = data.finals[i]
			res.push([
				`    #${i + 1}  ${player.realName}` + (player.team === data.winner ? '' : `（${player.team}）`),
				player.selectedKit,
				`${player.finalKills}FK`,
				`${(player.totalDamage / 2).toFixed(2)} 输出`,
				`${(player.takenDamage / 2).toFixed(2)} 承伤`,
			].join(' / '))
		}
	}

	for (const color in data.teams) {
		res.push(Column({ [data.options.allteam ? `${color}队战绩榜` : '获胜队伍战绩榜']: '' }))
		for (let i = 0; i < Math.min(data.options.allteam ? (color === data.winner ? 8 : 5) : 3, data.teams[color].length); i++) {
			const player = data.teams[color][i]
			res.push([
				`    #${i + 1}  ${player.realName}`,
				player.selectedKit,
				`${player.finalKills}FK${player.finalAssists}FA`,
				`${(player.totalDamage / 2).toFixed(2)} 输出`,
				`${(player.takenDamage / 2).toFixed(2)} 承伤`,
			].join(' / '))
		}
	}

	return res.join('\n')
}