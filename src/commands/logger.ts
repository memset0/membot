import { User, Context, Session, segment } from 'koishi'

export default (ctx: Context) => {
	ctx.command('logger', '调试工具', { authority: 3 })

	ctx.command('logger.session', '输出 session 信息', { authority: 3 })
		.action(({ session }) => {
			return JSON.stringify(session, null, 2)
		})

	ctx.command('logger.user <userId>', '输出用户数据', { authority: 3 })
		.action(async ({ session }, userId) => {
			const data = await ctx.database.getUser(session.platform, userId || session.userId)
			const text = JSON.stringify(data, null, 2)
			if (session.platform === 'telegram') {
				return segment('html') + '<pre><code>' + text + '</code></pre>'
			} else {
				return text
			}
		})

	ctx.command('logger.channel <channelId>', '输出频道数据', { authority: 3 })
		.action(async ({ session }, channelId) => {
			const data = await ctx.database.getChannel(session.platform, channelId || session.channelId)
			const text = JSON.stringify(data, null, 2)
			if (session.platform === 'telegram') {
				return segment('html') + '<pre><code>' + text + '</code></pre>'
			} else {
				return text
			}
		})

	ctx.platform('onebot')
		.command('logger.channel.member <channelId>', '输出频道列表', { authority: 3 })
		.action(async ({ session }, channelId) => {
			const data = await session.bot.internal.getGroupMemberList(channelId || session.channelId)
			const text = JSON.stringify(data, null, 2)
			if (session.platform === 'telegram') {
				return segment('html') + '<pre><code>' + text + '</code></pre>'
			} else {
				return text
			}
		})
}