export default (ctx) => {
	ctx.command('logger', '调试工具');

	ctx.command('logger.session', '输出 session 信息')
		.action(({ session }) => {
			return JSON.stringify(session);
		});
};