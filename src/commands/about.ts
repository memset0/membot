import { Context } from '@koishijs/core';

export interface Config {
	msg: Array<String>,
};

export default function (ctx: Context, config: Config) {
	ctx.command('about', '关于本 bot').action((_) => config.msg.join('\n'));
};