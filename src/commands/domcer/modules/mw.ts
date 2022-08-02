import { Context } from 'koishi'

import { Checker } from '../checker'
import { get, getJSON } from '../api'
import { codeErrorMessage } from '../utils'

export const TeamColorList = ['RED', 'BLUE', 'YELLOW', 'GREEN']

export const TeamColorRemap = {
	'BLUE': '蓝',
	'RED': '红',
	'YELLOW': '黄',
	'GREEN': '绿',
}

export const MegaWallsModeRemap = {
	'NORMAL': '普通模式',
	'CLONE': '克隆大作战',
	'INFINITE': '无限火力',
}


export function apply(ctx: Context) {
	ctx.command('domcer.mw <username:string>', '查询超级战墙数据')
		.alias('domcer.megawall')
		.alias('domcer.megawalls')
		.usage('（2022.3.15更新）修复数据值翻倍的问题\n' +
			'（2022.3.13更新）战绩默认统计近30日内对局，可用-g选项切换\n' +
			'（2022.2.4更新）战绩支持自定义取样比例，默认25%，输出和承伤分别计算\n' +
			'（2022.1.31更新）战绩只统计数据值前25%的对局')
		.option('global', '-g 筛选器：统计全局战绩')
		.option('allmode', '-a 筛选器：所有模式')
		.option('clonemode', '-c 筛选器：克隆大作战')
		.option('infinitemode', '-f 筛选器：无限火力')
		.option('kit', '-k [name] 职业筛选器')
		.option('ratio', '-r <value> 取样比例', { fallback: 0.25 })
		// .option('minTotalDamage', '-d [value]')
		// .option('minTakenDamage', '-t [value]')
		.check((_, name) => Checker.isUserName(name))
		.check(({ options }) => Checker.isMegaWallsKit(options.kit))
		.check(({ options }) => Checker.isRatio(options.ratio))
		// .check(({ options }) => Checker.isNotEmpty(options.minTotalDamage) && Checker.isInteger(options.minTotalDamage))
		// .check(({ options }) => Checker.isNotEmpty(options.minTakenDamage) && Checker.isInteger(options.minTakenDamage))
		.action(async ({ session, options }, name: string) => {
			if (!name) { return session.execute('help domcer.mw') }
			const data = await getJSON('/match/getMegaWallsMatchList', { name })
			if (data.status !== 200) { return codeErrorMessage(data.status) }
			if (data.data.length === 0) { return `该玩家没有超级战墙游玩历史` }
			// logger.info(name, JSON.stringify(options))

			if ((options.allmode ? 1 : 0) + (options.infinitemode ? 1 : 0) + (options.clonemode ? 1 : 0) > 1) {
				return '模式筛选器至多启用一个'
			}

			const nowTime = Date.now()
			const sum = {
				mvps: 0,
				games: 0,
				alives: 0,
				wins: 0,
				counter: 0,
				finalKills: 0,
				finalAssists: 0,
				totalDamage: 0,
				takenDamage: 0,
			}
			const average = {
				totalDamage: 0,
				takenDamage: 0,
			}
			let allTotalDamage = []
			let allTakenDamage = []
			let kitCounterMap = new Map<string, number>()
			let monlyGames = 0
			let monthlyTotalDamage = []
			let monthlyTakenDamage = []
			let monthlyKitCounterMap = new Map<string, number>()

			for (const round of data.data) {
				if (round.mode == 'NORMAL' && (options.infinitemode || options.clonemode)) { continue }
				if (round.mode == 'CLONE' && !(options.clonemode || options.allmode)) { continue }
				if (round.mode == 'INFINITE' && !(options.infinitemode || options.allmode)) { continue }
				if (options.kit && round.selectedKit != options.kit) { continue }

				sum.games += 1
				sum.finalKills += round.finalKills
				sum.finalAssists += round.finalAssists
				kitCounterMap[round.selectedKit] = (kitCounterMap[round.selectedKit] || 0) + 1
				if (round.winner == round.team) {
					sum.wins += 1
					if (round.mvp) sum.mvps += 1
				}

				if (round.liveInDeathMatch) {
					sum.alives += 1
					allTotalDamage.push(round.totalDamage)
					allTakenDamage.push(round.takenDamage)
				}
				if (nowTime - round.startTime <= 1000 * 3600 * 24 * 30) {
					monlyGames += 1
					monthlyKitCounterMap[round.selectedKit] = (monthlyKitCounterMap[round.selectedKit] || 0) + 1
					if (round.liveInDeathMatch) {
						monthlyTotalDamage.push(round.totalDamage)
						monthlyTakenDamage.push(round.takenDamage)
					}
				}
			}

			if (allTotalDamage.length && monthlyTotalDamage.length < 5) {
				options.global = true
			}
			if (!options.global) {
				allTotalDamage = monthlyTotalDamage
				allTakenDamage = monthlyTakenDamage
				kitCounterMap = monthlyKitCounterMap
			}

			const countedGames = options.global ? sum.games : monlyGames
			let commonlyUsed = []
			for (const kit in kitCounterMap) {
				commonlyUsed.push(kit)
			}
			commonlyUsed.sort((a, b) => (kitCounterMap[b] - kitCounterMap[a]))
			if (commonlyUsed.length > 3) commonlyUsed = commonlyUsed.slice(0, 3)
			const kitParser = (kit: string) => {
				return `${kit}(${Math.floor(kitCounterMap[kit] / countedGames * 100)}%)`
			}

			allTotalDamage.sort((a, b) => (b - a))
			allTakenDamage.sort((a, b) => (b - a))
			allTotalDamage = allTotalDamage.slice(0, Math.ceil(allTotalDamage.length * options.ratio))
			allTakenDamage = allTakenDamage.slice(0, Math.ceil(allTakenDamage.length * options.ratio))

			for (const totalDamage of allTotalDamage) {
				sum.totalDamage += totalDamage
			}
			for (const takenDamage of allTakenDamage) {
				sum.takenDamage += takenDamage
			}
			average.totalDamage = sum.totalDamage / allTotalDamage.length / 2.
			average.takenDamage = sum.takenDamage / allTakenDamage.length / 2.

			let res = `${name} 的超级战墙数据\n`

			if (sum.games) {
				let limits = []
				if (options.kit) limits.push(options.kit)
				if (options.global) {
					limits.push('全局战绩')
				}
				if (options.allmode) {
					limits.push('所有模式')
				} else if (options.clonemode) {
					limits.push('克隆大作战')
				} else if (options.infinitemode) {
					limits.push('无限火力')
				}
				if (limits.length) {
					res = res.slice(0, -1) + `（筛选器已启用：${limits.join(' / ')}）\n`
				}

				res += `【最终击杀】${sum.finalKills}【最终助攻】${sum.finalAssists}【MVP】${sum.mvps}\n`
				res += `【对局数】${sum.games}【DM 数】${sum.alives}【胜局数】${sum.wins}【胜率】${(sum.wins / sum.games * 100).toFixed(2)}%\n`
				if (sum.alives) res += `【场均输出】${average.totalDamage.toFixed(4)}【场均承伤】${average.takenDamage.toFixed(4)}\n`
				if (!options.kit) res += `【常用职业】${commonlyUsed.map(kitParser).join(' ')}\n`

			} else {
				res += '没有符合条件的对局\n'
			}

			session.send(res.slice(0, -1))
		})


	ctx.command('domcer.mwl <username:string>', '查询超级战墙对局列表')
		.alias('domcer.mwlist')
		.alias('domcer.megawallList')
		.alias('domcer.megawallsList')
		.option('page', '-p [page]')
		.check((_, name) => Checker.isUserName(name))
		.check(({ options }) => Checker.isNotEmpty(options.page) && Checker.isInteger(options.page))
		.action(async ({ session, options }, name: string) => {
			if (!name) { return session.execute('help domcer.mwl') }
			const data = await getJSON('/match/getMegaWallsMatchList', { name })
			if (data.status !== 200) { return codeErrorMessage(data.status) }
			if (data.data.length === 0) { return `该玩家没有超级战墙游玩历史` }

			const result = []
			result.push(`${name} 的超级战墙对局列表`)

			const rounds = data.data
			rounds.sort((a, b) => (b.endTime - a.endTime))

			const perPage = 10
			const totalPage = Math.ceil(rounds.length / perPage)
			const currentPage = options.page ? parseInt(options.page) : 1

			if (currentPage < 1 || currentPage > totalPage) { return `共${totalPage}页，当前页数${currentPage}不在合法范围内` }

			for (let i = 1 + (currentPage - 1) * perPage; i <= currentPage * perPage && i <= rounds.length; i++) {
				const round = rounds[i - 1]
				result.push([
					`#${i}. ${round.id}`,
					round.mapName + (round.mode != 'NORMAL' ? '(' + MegaWallsModeRemap[round.mode] + ')' : ''),
					round.selectedKit,
					TeamColorRemap[round.team] + '队',
					TeamColorList.includes(round.winner) ? (round.team == round.winner ? '胜' : '负') : '平局',
					`${round.finalKills}FK${round.finalAssists}FA`,
					round.liveInDeathMatch ? `${(round.totalDamage / 2).toFixed(2)}输出 / ${(round.takenDamage / 2).toFixed(2)}承伤` : '未参与死亡竞赛',
				].join(' / '))
			}

			result.push(`第${currentPage}页，共${totalPage}页`)
			session.send(result.join('\n'))
		})


	ctx.command('domcer.mwr <roundID:string>', '查询超级战墙对局')
		.alias('domcer.mwround')
		.alias('domcer.megawallRound')
		.alias('domcer.megawallsRound')
		.check((_, matchID) => Checker.isMatchID(matchID))
		.action(async ({ session }, matchID: string) => {
			if (!matchID) { return session.execute('help domcer.mwr') }
			const plain = await get('/match/megawalls', { id: matchID })
			if (plain == '') { return '对局不存在' }

			const data = JSON.parse(plain)

			const round = data
			const time = new Date(round.endTime)
			const result = []
			result.push(`超级战墙对局 ${round.id} / ${round.mapName} / ${MegaWallsModeRemap[round.mode]}`)
			result.push(`【时间】${time.toChineseString()}`)

			if (round.winner in TeamColorList) {
				result.push(`【获胜队伍】${TeamColorRemap[round.winner]}队【MVP】${round.mvp}`)
			} else {
				result.push('【获胜队伍】无')
			}

			const teams = {}
			teams[round.winner] = []
			for (const color of TeamColorList) {
				teams[color] = []
			}

			for (const player of data.playerStatistics) {
				if (player.liveInDeathMatch) { teams[player.team].push(player) }
			}

			for (const teamColor in teams) {
				const teamPlayers = teams[teamColor]
				teamPlayers.sort((a, b) => ((b.totalDamage + b.takenDamage) - (a.totalDamage + a.takenDamage)))
				if (teamPlayers.length) {
					result.push(`【${TeamColorRemap[teamColor]}队】`)
					for (let i = 1; i <= Math.min(teamColor == round.winner ? 6 : 4, teamPlayers.length); i++) {
						const player = teamPlayers[i - 1]
						result.push([
							`#${i}. ${player.realName}`,
							player.selectedKit,
							`${player.finalKills}FK${player.finalAssists}FA`,
							`${(player.totalDamage / 2).toFixed(2)}输出`,
							`${(player.takenDamage / 2).toFixed(2)}承伤`,
						].join(' / '))
					}
				}
			}

			session.send(result.join('\n'))
		})
}