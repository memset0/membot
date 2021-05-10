import { Context } from 'koishi';

import { get, getJSON } from './api';

async function sendMessages(session, messageList) {
	for await (const message of messageList) {
		await session.send(message);
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
				`[${data.data.rank}] ${data.data.realName}`,
				`UUID: ${data.data.uuid}`,
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
				`硬币: ${data.data.coins}`,
				`组队模式击杀: ${data.data.teamKills} 死亡: ${data.data.teamDeath} KD比: ${(data.data.teamKills / data.data.teamDeath).toFixed(4)}`,
				`组队模式获胜: ${data.data.teamWins} 场次: ${data.data.teamGames} 获胜率: ${(data.data.teamWins / data.data.teamGames * 100).toFixed(2)}%`,
			])
		});

	ctx.command('domcer.bedwars <username>', '查询起床战争数据')
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
				`硬币: ${data.data.coins} 奖励箱: ${data.data.chest} 等级: ${data.data.level} 经验: ${data.data.xp}`,
				`总摧毁床数: ${data.data.bedDestroyed} 总被摧毁床数: ${data.data.bedBeenDestroyed}`,
				`总获胜场次: ${data.data.wins} 总局数: ${data.data.games} 获胜率: ${(data.data.wins / data.data.games * 100).toFixed(2)}%`,
				`总击杀: ${data.data.kills} 总死亡: ${data.data.deaths} KD比: ${(data.data.kills / data.data.deaths).toFixed(4)}`,
				`总最终击杀: ${data.data.finalKills} 总最终死亡: ${data.data.finalDeaths} Final KD比: ${(data.data.finalKills / data.data.finalDeaths).toFixed(4)}`,
			]);
		});

	ctx.command('domcer.megawalls <username>', '查询超级战墙数据')
		.action(async (arg, name) => {
			const data = await getJSON('/match/getMegaWallsMatchList', { name });
			if (data.status !== 200) {
				return `接口返回错误: ${data.status}`;
			}

			let sum = {
				games: 0,
				alives: 0,
				kills: 0,
				wins: 0,
				finalKills: 0,
				totalDamage: 0,
				takenDamage: 0,
			};
			console.log(data.data);

			for (const game of data.data) {
				sum.games += 1;
				if (game.winner == game.team) {
					sum.wins += 1;
				}

				if (game.totalDamage > 0) {
					sum.alives += 1;
					sum.totalDamage += game.totalDamage;
					sum.takenDamage += game.takenDamage;
				}

				sum.kills += game.kills;
				sum.finalKills += game.finalKills;
			}

			sendMessages(arg.session, [
				`击杀: ${sum.kills} 最终击杀: ${sum.finalKills}`,
				`对局数: ${sum.games} 获胜局数: ${sum.wins} 存活到死斗局数: ${sum.alives}`,
				`总伤害: ${sum.totalDamage} 平均伤害: ${(sum.totalDamage / sum.alives).toFixed(4)}`,
				`总承伤: ${sum.takenDamage} 平均承伤: ${(sum.takenDamage / sum.alives).toFixed(4)}`,
				'（官方 API 提供的数据可能有误，仅供参考）'
			]);
		});
};