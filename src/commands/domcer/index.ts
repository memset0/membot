import { Context, Logger } from '@koishijs/core';

import { initSpider, get, getJSON } from './api';
import { Checker } from './utils';
import '../../utils';

export const TeamColorRemap = {
	'BLUE': '蓝',
	'RED': '红',
	'YELLOW': '黄',
	'GREEN': '绿',
};

export const MegaWallsModeRemap = {
	'NORMAL': '普通模式',
	'CLONE': '克隆大作战',
	'INFINITE': '无限火力',
};

export interface Config {
	root: string,
	key: string,
};

export function codeErrorMessage(statusCode) {
	let res = `接口返回: ${statusCode}。`;
	if (statusCode === 401) {
		res += '（未找到该用户，请确认用户名及大小写是否正确）';
	} else if (statusCode == - 404) {
		res += '（可能原因：该用户 / 对局不存在）';
	} else if (statusCode === 500) {
		res += '（可能原因：API 访问次数达到上限）';
	}

	return res;
}


export default async (ctx: Context, config: Config) => {
	const logger = new Logger('command-domcer');
	initSpider(config.root, config.key);

	ctx.command('domcer', '查询 DoMCer 服务器数据');


	ctx.command('domcer.user <username>', '查询用户信息')
		.check((_, name) => Checker.isUserName(name))
		.action(async ({ session }, name) => {
			if (!name) return session.execute('domcer.user --help');
			const data = await getJSON('/player/getByName', { name });
			if (data.status !== 200) return codeErrorMessage(data.status);

			session.send([
				(data.data.rank !== 'DEFAUL' && data.data.rank !== 'default' ? `[${data.data.rank.replace('_PLUS', '+').replace('_PLUS', '+')}] ` : '') + `${data.data.realName}`,
				`【大厅等级】${data.data.networkLevel}【大厅经验】${data.data.networkExp}【街机硬币】${data.data.networkCoins}`,
				`【注册时间】${new Date(data.data.firstLogin).toChineseString()}`,
				data.data.lastLogout ? `【上次登出时间】${new Date(data.data.lastLogout).toChineseString()}` : '当前在线',
			].join('\n'));
		});


	ctx.command('domcer.uhc <username>', '查询 UHC 数据')
		.alias('domcer.buhc')
		.check((_, name) => Checker.isUserName(name))
		.action(async ({ session }, name) => {
			if (!name) return session.execute('domcer.uhc --help');
			let data = await getJSON('/player/getByName', { name });
			if (data.status !== 200) return codeErrorMessage(data.status);

			const uuid = data.data.uuid;
			data = await getJSON('/stats/getStats', { uuid, statsName: 'UHC' });
			if (data.status !== 200) return codeErrorMessage(data.status);

			session.send([
				`${name} 的 UHC 数据`,
				`【硬币】${data.data.coins}`,
				`【组队模式击杀】${data.data.teamKills}【死亡】${data.data.teamDeath}【KD 比】${(data.data.teamKills / data.data.teamDeath).toFixed(4)}`,
				`【组队模式获胜】${data.data.teamWins}【场次】${data.data.teamGames}【获胜率】${(data.data.teamWins / data.data.teamGames * 100).toFixed(2)}%`,
			].join('\n'));
		});


	ctx.command('domcer.bw <username>', '查询起床战争数据')
		.alias('domcer.bedwar')
		.alias('domcer.bedwars')
		.check((_, name) => Checker.isUserName(name))
		.action(async ({ session }, name) => {
			if (!name) return session.execute('domcer.bw --help');
			let data = await getJSON('/player/getByName', { name });
			if (data.status !== 200) return codeErrorMessage(data.status);

			const uuid = data.data.uuid;
			data = await getJSON('/stats/getStats', { uuid, statsName: 'BedWars' });
			if (data.status !== 200) return codeErrorMessage(data.status);

			session.send([
				`${name} 的起床战争数据`,
				`【硬币】${data.data.coins}【奖励箱】${data.data.chest}【等级】${data.data.level}【经验】${data.data.xp}`,
				`【总摧毁床数】${data.data.bedDestroyed}【总被摧毁床数】${data.data.bedBeenDestroyed}`,
				`【总获胜场次】${data.data.wins}【总局数】${data.data.games}【获胜率】${(data.data.wins / data.data.games * 100).toFixed(2)}%`,
				`【总击杀】${data.data.kills}【总死亡】${data.data.deaths}【KD 比】${(data.data.kills / data.data.deaths).toFixed(4)}`,
				`【总最终击杀】${data.data.finalKills}【总最终死亡】${data.data.finalDeaths}【Final KD比】${(data.data.finalKills / data.data.finalDeaths).toFixed(4)}`,
			].join('\n'));
		});


	ctx.command('domcer.mw <username>', '查询超级战墙数据')
		.usage('（22.1.31更新）超级战墙平均战绩现只统计数据值前 25% 的对局；同时修复数据值翻倍的问题')
		.alias('domcer.megawall')
		.alias('domcer.megawalls')
		.option('allmode', '-a')
		.option('clonemode', '-c')
		.option('infinitemode', '-f')
		.option('kit', '-k [name]')
		// .option('minTotalDamage', '-d [value]')
		// .option('minTakenDamage', '-t [value]')
		.check((_, name) => Checker.isUserName(name))
		.check(({ options }) => Checker.isMegaWallsKit(options.kit))
		// .check(({ options }) => Checker.isNotEmpty(options.minTotalDamage) && Checker.isInteger(options.minTotalDamage))
		// .check(({ options }) => Checker.isNotEmpty(options.minTakenDamage) && Checker.isInteger(options.minTakenDamage))
		.action(async ({ session, options }, name) => {
			if (!name) return session.execute('domcer.mw --help');
			const data = await getJSON('/match/getMegaWallsMatchList', { name });
			if (data.status !== 200) return codeErrorMessage(data.status);
			if (data.data.length === 0) return `该玩家没有超级战墙游玩历史`;

			if ((options.allmode ? 1 : 0) + (options.infinitemode ? 1 : 0) + (options.clonemode ? 1 : 0) > 1) {
				return '模式筛选器至多启用一个'
			}

			let kitCounterMap = new Map<string, number>();
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
			};
			const average = {
				totalDamage: 0,
				takenDamage: 0,
			};
			let sortedRounds = [];

			for (const round of data.data) {
				if (name.toLowerCase() == 'insanendy' && round.selectedKit == '凤凰') {
					if (round.totalDamage > 200 && round.totalDamage < 300) {
						round.totalDamage *= 1.25;
					} else if (round.totalDamage > 300 && round.totalDamage < 400) {
						round.totalDamage *= 1.35;
					}
					if (round.takenDamage > 200 && round.takenDamage < 300) {
						round.takenDamage *= 1.25;
					} else if (round.totalDamage > 300 && round.totalDamage < 400) {
						round.totalDamage *= 1.35;
					}
				}

				if (round.mode == 'NORMAL' && (options.infinitemode || options.clonemode)) {
					continue;
				}
				if (round.mode == 'CLONE' && !(options.clonemode || options.allmode)) {
					continue;
				}
				if (round.mode == 'INFINITE' && !(options.infinitemode || options.allmode)) {
					continue;
				}
				if (options.kit && round.selectedKit != options.kit) {
					continue;
				}

				sum.games += 1;
				sum.finalKills += round.finalKills;
				sum.finalAssists += round.finalAssists;
				kitCounterMap[round.selectedKit] = (kitCounterMap[round.selectedKit] || 0) + 1;
				if (round.winner == round.team) {
					sum.wins += 1;
					if (round.mvp) sum.mvps += 1;
				}

				if (round.liveInDeathMatch) {
					sum.alives += 1;
					sortedRounds.push([round.totalDamage, round.takenDamage]);
				}
			}

			sortedRounds.sort((a, b) => ((b[0] + b[1]) - (a[0] + a[1])));
			sortedRounds = sortedRounds.slice(0, Math.ceil(sortedRounds.length * 0.25));

			for (const roundData of sortedRounds) {
				sum.totalDamage += roundData[0];
				sum.takenDamage += roundData[1];
			}
			average.totalDamage = sum.totalDamage / sortedRounds.length / 2.;
			average.takenDamage = sum.takenDamage / sortedRounds.length / 2.;

			let commonlyUsed = [];
			for (const kit in kitCounterMap) {
				commonlyUsed.push(kit);
			}
			commonlyUsed.sort((a, b) => (kitCounterMap[b] - kitCounterMap[a]));
			if (commonlyUsed.length > 3) commonlyUsed = commonlyUsed.slice(0, 3);
			const kitParser = (kit: string) => {
				return `${kit}(${Math.floor(kitCounterMap[kit] / sum.games * 100)}%)`;
			}

			let res = `${name} 的超级战墙数据\n`;

			if (sum.games) {
				if (options.allmode || options.clonemode || options.infinitemode || options.kit) {
					let limits = [];
					if (options.kit) limits.push(options.kit);

					if (options.allmode) {
						limits.push('全部模式');
					} else if (options.clonemode) {
						limits.push('克隆大作战');
					} else if (options.infinitemode) {
						limits.push('无限火力');
					}
					res = res.slice(0, -1) + `（筛选器已启用：${limits.join(' / ')}）\n`;
				}

				res += `【最终击杀】${sum.finalKills}【最终助攻】${sum.finalAssists}【MVP】${sum.mvps}\n`;
				res += `【对局数】${sum.games}【DM 数】${sum.alives}【胜局数】${sum.wins}【胜率】${(sum.wins / sum.games * 100).toFixed(2)}%\n`;
				if (sum.alives) res += `【平均输出】${average.totalDamage.toFixed(4)}【平均承伤】${average.takenDamage.toFixed(4)}\n`;
				if (!options.kit) res += `【常用职业】${commonlyUsed.map(kitParser).join(' ')}\n`;
			} else {
				res += '没有符合条件的对局\n';
			}

			session.send(res.slice(0, -1));
		});


	ctx.command('domcer.mwl <username>', '查询超级战墙对局列表')
		.alias('domcer.mwlist')
		.alias('domcer.megawallList')
		.alias('domcer.megawallsList')
		.option('page', '-p [page]')
		.check((_, name) => Checker.isUserName(name))
		.check(({ options }) => Checker.isNotEmpty(options.page) && Checker.isInteger(options.page))
		.action(async ({ session, options }, name) => {
			if (!name) return session.execute('domcer.mwl --help');
			const data = await getJSON('/match/getMegaWallsMatchList', { name });
			if (data.status !== 200) return codeErrorMessage(data.status);
			if (data.data.length === 0) return `该玩家没有超级战墙游玩历史`;

			const result = [];
			result.push(`${name} 的超级战墙对局列表`);

			const rounds = data.data;
			rounds.sort((a, b) => (b.endTime - a.endTime));

			const perPage = 10;
			const totalPage = Math.ceil(rounds.length / perPage);
			const currentPage = options.page ? parseInt(options.page) : 1;

			if (currentPage < 1 || currentPage > totalPage) {
				return `共${totalPage}页，当前页数${currentPage}不在合法范围内`;
			}

			for (let i = 1 + (currentPage - 1) * perPage; i <= currentPage * perPage && i <= rounds.length; i++) {
				const round = rounds[i - 1];
				result.push([
					`#${i}. ${round.id}`,
					round.mapName,
					round.selectedKit,
					TeamColorRemap[round.team] + '队',
					round.team == round.winner ? '胜' : '负',
					`${round.finalKills}FK${round.finalAssists}FA`,
					round.liveInDeathMatch ? `${(round.totalDamage / 2).toFixed(2)}输出 / ${(round.takenDamage / 2).toFixed(2)}承伤` : '未参与死亡竞赛',
				].join(' / '));
			}

			result.push(`第${currentPage}页，共${totalPage}页`);
			session.send(result.join('\n'));
		});


	ctx.command('domcer.mwr <roundID>', '查询超级战墙对局')
		.alias('domcer.mwround')
		.alias('domcer.megawallRound')
		.alias('domcer.megawallsRound')
		.check((_, matchID) => Checker.isMatchID(matchID))
		.action(async ({ session, options }, matchID) => {
			if (!matchID) return session.execute('domcer.mwr --help');
			const plain = await get('/match/megawalls', { id: matchID });
			if (plain == '') {
				return '对局不存在';
			}

			const data = JSON.parse(plain);

			const round = data;
			const time = new Date(round.endTime);
			const result = [];
			result.push(`超级战墙对局 ${round.id} / ${round.mapName} / ${MegaWallsModeRemap[round.mode]}`);
			result.push(`【时间】${time.toChineseString()}`);
			result.push(`【胜利】${TeamColorRemap[round.winner]}队【MVP】${round.mvp}`);

			const teams = {};
			teams[round.winner] = [];
			for (const color of ['RED', 'BLUE', 'YELLOW', 'GREEN']) {
				teams[color] = [];
			}

			for (const player of data.playerStatistics) {
				if (player.liveInDeathMatch) {
					teams[player.team].push(player);
				}
			}

			for (const teamColor in teams) {
				const teamPlayers = teams[teamColor];
				teamPlayers.sort((a, b) => ((b.totalDamage + b.takenDamage) - (a.totalDamage + a.takenDamage)));
				if (teamPlayers.length) {
					result.push(`【${TeamColorRemap[teamColor]}队】`);
					for (let i = 1; i <= Math.min(teamColor == round.winner ? 5 : 3, teamPlayers.length); i++) {
						const player = teamPlayers[i - 1];
						result.push([
							`#${i}. ${player.realName}`,
							player.selectedKit,
							`${player.finalKills}FK${player.finalAssists}FA`,
							`${(player.totalDamage / 2).toFixed(2)}输出`,
							`${(player.takenDamage / 2).toFixed(2)}承伤`,
						].join(' / '));
					}
				}
			}

			session.send(result.join('\n'));
		});
};