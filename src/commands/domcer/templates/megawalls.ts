export default function (data: any, { Column }) {
	const res = []

	res.push(`${data.name} 的超级战墙数据`)
	if (data.limits.length) {
		res[0] += `（筛选器已启用：${data.limits.join(' / ')}）\n`
	}

	res.push(Column({
		'最终击杀': data.finalKills,
		'最终助攻': data.finalAssists,
		'MVP': data.mvps,
	}))

	res.push(Column({
		'对局': data.games,
		'DM': data.alives,
		'胜局': data.wins,
		'胜率': (data.wins / data.games * 100).toFixed(2),
	}))

	if (data.alives) {
		res.push(Column({
			'场均输出': data.average.totalDamage.toFixed(4),
			'场均承伤': data.average.takenDamage.toFixed(4),
		}))
	}

	if (!data.options.kit) {
		res.push(Column({
			'常用职业': data.commonKit,
		}))
	}

	return res.join('\n')
}