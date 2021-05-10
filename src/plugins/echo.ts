export default (ctx) => {
	ctx.command('echo <message:text>', '让 bot 成为复读机~')
		.action((_, message) => {
			return message;
		});
};