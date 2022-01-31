import { Bot, Context, Session } from 'koishi';

import config from '../config';


export default (ctx: Context) => {
	// onebot 平台下机器人被 @ 时自动转发给主人の账号
	let bot: null | Bot = null;
	let botSelfId: null | string = null;
	for (const currentBot of ctx.bots)
		if (currentBot.platform == 'onebot') {
			bot = currentBot;
			botSelfId = currentBot.config['selfId'];
		}
	if (!bot || !botSelfId) {
		return;
	}
	const mentionedKeyString = '[CQ:at,id=' + botSelfId + ']';

	ctx.middleware((session: Session, next) => {
		if (session.platform == 'onebot') {
			if (session.content.indexOf(mentionedKeyString) !== -1) {
				console.log(session, session.content.search(mentionedKeyString));
				let content = session.content;
				content = content.replace(mentionedKeyString, '@' + config.nickname);
				if (!session.guildId) {
					content = `【被提到的消息】来自 ${session.author.username}(${session.author.userId}) 的私聊\n` + content;
				} else {
					content = `【被提到的消息】来自 ${session.author.username}(${session.author.userId}) 的群聊 ${session.guildId}\n` + content;
				}
				bot.sendPrivateMessage(config.master.onebot, content);
			}
		}

		return next();
	})
};