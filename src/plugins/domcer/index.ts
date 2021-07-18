import * as moment from 'moment';
import { Context } from 'koishi-core';

import { initSpider, getJSON } from './api';
import { sendMessageList } from '../../modules/sender';

export interface Config {
	root: string,
	key: string,
};

export class Checker {
	static isNotEmpty(value) {
		return typeof value !== 'undefined' ? true : undefined
	}

	static isUserName(username) {
		username = String(username);
		if (!username || !username.length) return '[E] 请输入用户名';
		if (username.length > 20 || username.length <= 0) return '[E] 用户名不合法';
		return undefined;
	}

	static isInteger(number) {
		return isNaN(parseInt(number)) ? '[E] 参数必须为整数' : undefined;
	}
};

export function codeErrorMessage(statusCode) {
	let res = `接口返回错误: ${statusCode}`;
	if (statusCode === 401) {
		res += '（未找到该用户，请确认用户名及大小写是否正确）'
	}
	if (statusCode === 500) {
		res += '（API 访问次数达到上限）'
	}
	return res;
}

export function transformUTC(clock) {
	return moment(clock).format('YYYY年MM月DD日 hh:mm:ss');
}

export default async (ctx: Context, config: Config) => {
	initSpider(config.root, config.key);

	ctx.command('domcer', '查询 Domcer 服务器相关数据');

	ctx.command('domcer.user <username>', '查询用户信息')
		.check((_, name) => Checker.isUserName(name))
		.action(async ({ session }, name) => {
			const data = await getJSON('/player/getByName', { name });
			if (data.status !== 200) return codeErrorMessage(data.status);

			sendMessageList(session, [
				(data.data.rank !== 'DEFAUL' && data.data.rank !== 'default' ? `[${data.data.rank.replace('_PLUS', '+').replace('_PLUS', '+')}] ` : '') + `${data.data.realName}`,
				`大厅等级: ${data.data.networkLevel} 大厅经验: ${data.data.networkExp} 街机硬币: ${data.data.networkCoins}`,
				`注册时间: ${transformUTC(data.data.firstLogin)}`,
				data.data.lastLogout ? `上次登出时间: ${transformUTC(data.data.lastLogout)}\n` : '当前在线',
			]);
		});

	ctx.command('domcer.uhc <username>', '查询 UHC 数据')
		.check((_, name) => Checker.isUserName(name))
		.action(async ({ session }, name) => {
			let data = await getJSON('/player/getByName', { name });
			if (data.status !== 200) return codeErrorMessage(data.status);

			const uuid = data.data.uuid;
			data = await getJSON('/stats/getStats', { uuid, statsName: 'UHC' });
			if (data.status !== 200) return codeErrorMessage(data.status);

			sendMessageList(session, [
				`${name} 的 UHC 数据`,
				`硬币: ${data.data.coins}`,
				`组队模式击杀: ${data.data.teamKills} 死亡: ${data.data.teamDeath} KD比: ${(data.data.teamKills / data.data.teamDeath).toFixed(4)}`,
				`组队模式获胜: ${data.data.teamWins} 场次: ${data.data.teamGames} 获胜率: ${(data.data.teamWins / data.data.teamGames * 100).toFixed(2)}%`,
			])
		});

	ctx.command('domcer.bedwars <username>', '查询起床战争数据')
		.alias('domcer.bw')
		.alias('domcer.bedwar')
		.check((_, name) => Checker.isUserName(name))
		.action(async ({ session }, name) => {
			let data = await getJSON('/player/getByName', { name });
			if (data.status !== 200) return codeErrorMessage(data.status);

			const uuid = data.data.uuid;
			data = await getJSON('/stats/getStats', { uuid, statsName: 'BedWars' });
			if (data.status !== 200) return codeErrorMessage(data.status);

			sendMessageList(session, [
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
		.alias('domcer.megawall')
		.option('allmode', '-a')
		.option('minTotalDamage', '-d [value]')
		.option('minTakenDamage', '-t [value]')
		.check((_, name) => Checker.isUserName(name))
		.check(({ options }) => Checker.isNotEmpty(options.minTotalDamage) && Checker.isInteger(options.minTotalDamage))
		.check(({ options }) => Checker.isNotEmpty(options.minTakenDamage) && Checker.isInteger(options.minTakenDamage))
		.action(async ({ session, options }, name) => {
			const data = await getJSON('/match/getMegaWallsMatchList', { name });
			if (data.status !== 200) return codeErrorMessage(data.status);
			if (data.data.length === 0) return `该玩家没有超级战墙游玩历史`;

			let sum = {
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

			for (const game of data.data) {
				if (game.mode === 'NORMAL' || options.allmode) {
					sum.games += 1;
					sum.finalKills += game.finalKills;
					sum.finalAssists += game.finalAssists;
					if (game.winner == game.team) {
						sum.wins += 1;
						if (game.mvp) sum.mvps += 1;
					}

					if (game.liveInDeathMatch) {
						sum.alives += 1;
						if (!options.minTotalDamage || parseInt(options.minTotalDamage) <= game.totalDamage) {
							if (!options.minTakenDamage || parseInt(options.minTakenDamage) <= game.takenDamage) {
								sum.counter += 1;
								sum.totalDamage += game.totalDamage;
								sum.takenDamage += game.takenDamage;
							}
						}
					}
				}
			}

			let res = [
				`${name} 的超级战墙数据（${options.allmode ? '全部模式' : '经典模式'}）`,
				`最终击杀: ${sum.finalKills} 最终助攻: ${sum.finalAssists}`,
				`对局数: ${sum.games} 死斗存活局数: ${sum.alives} 获胜局数: ${sum.wins} MVP次数: ${sum.mvps}`,
			];

			if (!options.minTakenDamage && !options.minTotalDamage) {
				res = res.concat([
					`总伤害: ${sum.totalDamage} 平均伤害: ${(sum.totalDamage / sum.alives).toFixed(4)}`,
					`总承伤: ${sum.takenDamage} 平均承伤: ${(sum.takenDamage / sum.alives).toFixed(4)}`,
				]);

			} else {
				let limit = [];
				if (options.minTotalDamage) limit.push(`最少 ${options.minTotalDamage} 伤害`);
				if (options.minTakenDamage) limit.push(`最少 ${options.minTakenDamage} 承伤`);

				res = res.concat([
					`（筛选器已启用：${limit.join('，')}；符合条件的对局 ${sum.counter} 场）`,
				]);
				if (sum.counter) {
					res = res.concat([
						`总伤害: ${sum.totalDamage} 平均伤害: ${(sum.totalDamage / sum.counter).toFixed(4)}`,
						`总承伤: ${sum.takenDamage} 平均承伤: ${(sum.takenDamage / sum.counter).toFixed(4)}`,
					]);
				}
			}

			sendMessageList(session, res);
		});
};