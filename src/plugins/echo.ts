export default (ctx) => {
	ctx.command('echo <message:text>')
		.action((_, message) => {
			return message;
		});
};