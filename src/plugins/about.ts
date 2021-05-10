import config from '../config';

export default (ctx) => {
	ctx.command('about', '关于本 bot').action((_) => config.about.msg.join('\n'));
};