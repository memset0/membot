import { Context, Session } from 'koishi'
import verifier from '@koishijs/plugin-verifier'

export function apply(ctx: Context) {
	return
	console.log(verifier)

	verifier.apply(ctx, {
		onFriendRequest: true,
		onGuildMemberRequest: undefined,
		onGuildRequest: async (session: Session): Promise<boolean | void> => {
			const user = await session.observeUser(['authority'])
			if (user.authority >= 3) {
				return true
			} else if (user.authority <= 0) {
				return false
			}
		}
	})
}