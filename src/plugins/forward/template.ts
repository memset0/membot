import { Context, Session } from 'koishi'

import '../../utils/date'


export function templateArgvFactory(ctx: Context) {
	const functions = {
		'{userId}': (session: Session) => {
			return session.author.userId
		},

		'{userName}': (session: Session) => {
			if (session.platform === 'telegram') {
				return session.author.nickname || session.author.username
			} else {
				return session.author.username
			}
		},

		'{userCard}': (session: Session) => {
			if (session.platform === 'onebot') {
				return session.author.nickname
			}
			return functions['{userName}'](session)
		},

		'{userCardOnly}': (session: Session) => {
			if (session.platform === 'onebot') {
				return session.author.nickname
			}
			return ''
		},

		'{userTag}': (session: Session) => {
			return ''
		},

		'{time}': (session: Session) => {
			return (new Date(session.timestamp)).format('yyyy/MM/dd hh:mm')
		},
	}

	return functions
}