import { Bot, Context, Session } from 'koishi'
import * as qface from 'qface'


export class QFace {
	public static idToText(id) {
		return qface.get(id).QDes
	}
	public static idToUrl(id) {
		return qface.getUrl(id, 'https://qq-face.vercel.app')
	}
}


export interface BotMeta {
	guildId?: string
	platform?: string
	session?: Session
	ctx?: Context
	bot?: Bot
}

export function getBot(meta: BotMeta): Bot {
	if (meta.bot) { return meta.bot }
	if (meta.session) { return meta.session.bot }
	if (meta.platform && meta.ctx) {
		for (const bot of meta.ctx.bots) {
			if (bot.platform === meta.platform) {
				return bot
			}
		}
	}
}

export async function getUserName(platform: string, userId: string, meta: BotMeta = {}) {
	if (platform === 'onebot' && meta.guildId) {
		const bot = getBot(meta)
		if (bot) {
			const res = await bot.internal.getGroupMemberInfo(parseInt(meta.guildId), parseInt(userId), false /* no cache */)
			return res.card || res.nickname
		}
	}
}