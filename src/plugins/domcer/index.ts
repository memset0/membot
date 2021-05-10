import { Context } from 'koishi';

import { get, getJSON } from './api';

async function sendMessages(session, messageList) {
	if (session.platform === 'kaiheila') {
		for await (const message of messageList) {
			await session.send(message);
		}
	} else {
		await session.send(messageList.join('\n'));
	}
}

module.exports = async (ctx: Context) => {
	ctx.command('domcer.user <username>', '查询用户信息')
		.action(async (arg, name) => {
			const data = await getJSON('/player/getByName', { name });
			if (data.status !== 200) {
				return `接口返回错误: ${data.status}`;
			}

			sendMessages(arg.session, [
				(data.data.rank !== 'DEFAUL' ? `[${data.data.rank.replace('_PLUS', '+').replace('_PLUS', '+')}] ` : '') + `${data.data.realName}`,
				`大厅等级: ${data.data.networkLevel} 大厅经验: ${data.data.networkExp} 街机硬币: ${data.data.networkCoins}`,
				`注册时间: ${(new Date(data.data.firstLogin)).toString()}`,
				data.data.lastLogout ? `上次登出时间: ${(new Date(data.data.lastLogout)).toString()}\n` : '当前在线',
			]);
		});

	ctx.command('domcer.uhc <username>', '查询 UHC 数据')
		.action(async (arg, name) => {
			let data = await getJSON('/player/getByName', { name });
			if (data.status !== 200) {
				return `接口返回错误: ${data.status}`;
			}

			const uuid = data.data.uuid;
			data = await getJSON('/stats/getStats', { uuid, statsName: 'UHC' });
			if (data.status !== 200) {
				return `接口返回错误: ${data.status}`;
			}

			sendMessages(arg.session, [
				`${name} 的 UHC 数据`,
				`硬币: ${data.data.coins}`,
				`组队模式击杀: ${data.data.teamKills} 死亡: ${data.data.teamDeath} KD比: ${(data.data.teamKills / data.data.teamDeath).toFixed(4)}`,
				`组队模式获胜: ${data.data.teamWins} 场次: ${data.data.teamGames} 获胜率: ${(data.data.teamWins / data.data.teamGames * 100).toFixed(2)}%`,
			])
		});

	ctx.command('domcer.bedwars <username>', '查询起床战争数据')
		.alias('domcer.bw')
		.action(async (arg, name) => {
			let data = await getJSON('/player/getByName', { name });
			if (data.status !== 200) {
				return `接口返回错误: ${data.status}`;
			}

			const uuid = data.data.uuid;
			data = await getJSON('/stats/getStats', { uuid, statsName: 'BedWars' });
			if (data.status !== 200) {
				return `接口返回错误: ${data.status}`;
			}

			sendMessages(arg.session, [
				`${name} 的起床战争数据`,
				`硬币: ${data.data.coins} 奖励箱: ${data.data.chest} 等级: ${data.data.level} 经验: ${data.data.xp}`,
				`总摧毁床数: ${data.data.bedDestroyed} 总被摧毁床数: ${data.data.bedBeenDestroyed}`,
				`总获胜场次: ${data.data.wins} 总局数: ${data.data.games} 获胜率: ${(data.data.wins / data.data.games * 100).toFixed(2)}%`,
				`总击杀: ${data.data.kills} 总死亡: ${data.data.deaths} KD比: ${(data.data.kills / data.data.deaths).toFixed(4)}`,
				`总最终击杀: ${data.data.finalKills} 总最终死亡: ${data.data.finalDeaths} Final KD比: ${(data.data.finalKills / data.data.finalDeaths).toFixed(4)}`,
			]);
		});

	ctx.command('domcer.megawalls <username>', '查询超级战墙数据')
		.alias('domcer.mw')
		.action(async (arg, name) => {
			const data = await getJSON('/match/getMegaWallsMatchList', { name });
			if (data.status !== 200) {
				return `接口返回错误: ${data.status}`;
			}
			if (data.data.length === 0) {
				return `该玩家没有超级战墙游玩历史`;
			}

			let sum = {
				mvps: 0,
				games: 0,
				alives: 0,
				wins: 0,
				finalKills: 0,
				finalAssists: 0,
				totalDamage: 0,
				takenDamage: 0,
			};

			for (const game of data.data) {
				if (game.mode === 'NORMAL') {
					sum.games += 1;
					sum.finalKills += game.finalKills;
					sum.finalAssists += game.finalAssists;

					if (game.winner == game.team) {
						sum.wins += 1;
						if (game.mvp) {
							sum.mvps += 1;
						}
					}

					if (game.liveInDeathMatch) {
						sum.alives += 1;
						sum.totalDamage += game.totalDamage;
						sum.takenDamage += game.takenDamage;
					}
				}
			}

			sendMessages(arg.session, [
				`${name} 的超级战墙数据（经典模式）`,
				`最终击杀: ${sum.finalKills} 最终助攻: ${sum.finalAssists}`,
				`对局数: ${sum.games} 存活到死斗局数: ${sum.alives} 获胜局数: ${sum.wins} MVP次数: ${sum.mvps}`,
				`总伤害: ${sum.totalDamage} 平均伤害: ${(sum.totalDamage / sum.alives).toFixed(4)}`,
				`总承伤: ${sum.takenDamage} 平均承伤: ${(sum.takenDamage / sum.alives).toFixed(4)}`,
			]);
		});
};