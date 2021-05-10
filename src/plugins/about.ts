import config from '../config';
import { sendMessageList } from '../modules/sender';

module.exports = (ctx) => {
	ctx.command('about', '关于本 bot')
		.action((arg) => {
			sendMessageList(arg.session, config.about.msg);
		});
};