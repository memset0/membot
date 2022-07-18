import { segment, Bot, Context, Session } from 'koishi';

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
	const footer = '\n警告：请不要滥用此功能，否则可能导致账号被机器人封禁。';

	ctx.middleware((session: Session, next) => {
		if (session.platform == 'onebot') {
			if (session.content.indexOf(mentionedKeyString) !== -1 && !session.content.startsWith('[CQ:quote,id=')) {
				let content = session.content;
				if (content.replace(mentionedKeyString, '').replace(/\s/g, '') == '') {
					return `${segment('at', { id: session.author.userId })}欢迎使用机器人的反馈功能，想说什么话请直接在消息中@本机器人哦。` + footer;
				}
				content = content.replace(mentionedKeyString, '@' + config.nickname);
				if (!session.guildId) {
					content = `【消息转发】来自 ${session.author.username}(${session.author.userId}) 的私聊\n` + content;
				} else {
					content = `【消息转发】来自 ${session.author.username}(${session.author.userId}) 的群聊 ${session.guildId}\n` + content;
				}
				bot.sendPrivateMessage(config.master.onebot, content);
				return `${segment('at', { id: session.author.userId })}你的反馈已成功转发给主人，想说什么就继续留言哦。` + footer;
			}
		}

		return next();
	}, true);
};