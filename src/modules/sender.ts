import { Session } from '@koishijs/core';

export async function sendMessageList(session: Session, messageList: Array<String>) {
	await session.send(messageList.join('\n'));

	// if (session.platform === 'kaiheila') {
	// 	for await (const message of messageList) {
	// 		await session.send(message);
	// 	}
	// } else {
	// 	await session.send(messageList.join('\n'));
	// }
}