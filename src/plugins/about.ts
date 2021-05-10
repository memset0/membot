import config from '../config';
import { sendMessageList } from '../modules/sender';

export default (ctx) => {
	ctx.command('about', '关于本 bot')
		.action((arg) => {
			sendMessageList(arg.session, config.about.msg);
		});
};