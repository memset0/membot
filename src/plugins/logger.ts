export default (ctx) => {
	ctx.command('logger', '调试工具');

	ctx.command('logger.session', '输出 session 信息')
		.action((arg) => {
			console.log(arg);
			return JSON.stringify(arg.session);
		});
};