import { Bot, Context } from 'koishi'

export function selectBotByPlatform(ctx: Context, platform: string): Bot | null {
	for (const currentBot of ctx.app.bots) {
		if (currentBot.platform === platform) {
			return currentBot
		}
	}
	return null
}