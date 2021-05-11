import { Context } from 'koishi-core';
import { apply as applyDefault } from 'koishi-plugin-chess';

export default function (ctx: Context) {
	applyDefault(ctx);
}