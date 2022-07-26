import { Context, segment } from 'koishi'

import { deepCopy } from '../utils/type'


export const name = 'about'


function adaptOnebot(chain) {
	chain = deepCopy(chain)
	for (const i in chain) {
		if (chain[i].type === 'text' && chain[i]?.data?.content?.startsWith('- ')) {
			chain[i].data.content = `  ${decodeURIComponent('%E2%97%8F')}  ${chain[i].data.content.slice(2)}`
			// 实心圆点, https://unicode-table.com/cn/25CF/
		}
	}
	return chain
}

function adaptKook(chain) {
	chain = deepCopy(chain)
	chain.unshift({ type: 'markdown' })
	for (const i in chain) {
		if (chain[i].type === 'text' && chain[i].data?.content?.startsWith('- ')) {
			chain[i].data.content = `  ${decodeURIComponent('%C2%B7')} ${chain[i].data.content.slice(2)}`
		}
		if (chain[i].type === 'text' && chain[i].data?.content) {
			chain[i].data.content = chain[i].data.content
				.replace('机器人不理你哦', '(spl)机器人不理你哦(spl)')
				.replace(' memset0 ', ' [memset0](https://memset0.cn/) ')
				.replace(' /help ', ' `/help` ')
				.replace(' / ', ' `/` ')
				.replace(' . ', ' `.` ')
		}
	}
	return chain
}


export function apply(ctx: Context) {
	const t = (s: any) => ({ type: 'text', data: { content: s as string } })

	const chain = [
		t('Hello，这里是敲可爱的 memset0 的机器人！\n'),
		t('- 不会使用机器人？输入 /help 查看指令列表\n'),
		t('- 调用指令时，记得前使用字符 / 或 . 作为前缀~\n'),
		t('- 反馈问题可以直接 at 机器人，但是如果不友善的话...小心机器人不理你哦！\n'),
	]

	const message = {
		'onebot': segment.join(adaptOnebot(chain)),
		'kaiheila': segment.join(adaptKook(chain)),
		'default': segment.join(chain),
	}

	ctx.command('about', '关于这个机器人...')
		.action(({ session }) => {
			if (Object.keys(message).includes(session.platform)) {
				return message[session.platform]
			} else {
				return message['default']
			}
		})
}