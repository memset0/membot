import { Context } from 'koishi-core';
import { apply as applyDefault, Config as ConfigDefault } from 'koishi-plugin-puppeteer';

export interface Config extends ConfigDefault { };

export default function (ctx: Context, config: Config) {
	applyDefault(ctx, config);
}