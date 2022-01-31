// import { User } from 'koishi';

// export default (ctx) => {
// 	ctx.command('logger', '调试工具');

// 	ctx.command('logger.session', '输出 session 信息')
// 		.action(({ session }) => {
// 			return JSON.stringify(session);
// 		});
	
// 	ctx.command('logger.user', '输出 user 信息')
// 		.action(({ session }) => {
// 			let currentPlatform = session.platform;
// 			let currentUserID = session.sender.userId;
// 			let currentUser = User.create(currentPlatform, currentUserID);
			
// 			return JSON.stringify(currentUser);
// 		});
// };