import { Context, Session } from 'koishi'

import '../../utils/date'


export function templateArgvFactory(ctx: Context) {
	const functions = {
		'{userId}': (session: Session) => {
			return session.author.userId
		},

		'{userName}': (session: Session) => {
			return session.author.username || session.author.nickname
		},

		'{userNick}': (session: Session) => {
			return session.author.nickname || session.author.username
		},

		'{userNameAdditional}': (session: Session) => {
			return session.author.username && session.author.nickname && session.author.username !== session.author.nickname ?
				session.author.nickname :
				''
		},

		'{userNickAdditional}': (session: Session) => {
			return session.author.username && session.author.nickname && session.author.username !== session.author.nickname ?
				session.author.username :
				''
		},

		'{userTag}': (session: Session) => {
			// not supported yet
			return ''
		},

		'{time}': (session: Session) => {
			return (new Date(session.timestamp)).format('yyyy/MM/dd hh:mm')
		},
	}

	return functions
}