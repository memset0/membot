import { Logger, segment } from 'koishi'
import Timeout from 'await-timeout'
import mcping from '@l2studio/minecraft-ping'
import { Server, JavaEditionServerStatus, BedrockEditionServerStatus } from '@l2studio/minecraft-ping'

const logger = new Logger('minecraft.ping')

function parseDescripiton(content: string) {
	return content
		.replace(/^\s+|\s+$/g, '') //strip
		.replace(/§./g, '') // remove color tag
}

export function adaptJavaServerMeta(address: string, meta: JavaEditionServerStatus) {
	// logger.info('java', meta)
	let flushString = `服务器: ${address} (Java Edition)`
	if (meta.favicon) {
		flushString += segment.image('base64://' + meta.favicon.slice('data:image/png;base64,'.length))
	}
	if (meta.description) {
		flushString += `简介：${parseDescripiton(meta.description as string)}\n`
	}
	if (meta.players) {  // should always be true
		flushString += `玩家：${meta.players.online} / ${meta.players.max}\n`
	}
	if (meta?.version?.name || meta?.version) {
		flushString += `版本：${meta?.version?.name || meta?.version}\n`
	}
	return flushString
}

export function adaptBedrockServerMeta(address: string, meta: BedrockEditionServerStatus) {
	// logger.info('bedrock', meta)
	return 'bedrock'
}


export default async function ping(address: string) {
	const timer = new Timeout()
	let res = null
	res = await Promise.race([
		adaptJavaServerMeta(address, await mcping(Server.JAVA, address)),
		timer.set(2000, '未找到指定服务器，可能是服务器不存在或响应超时'),
	])
	// try {
	// 	res = await Promise.race([
	// 		adaptJavaServerMeta(address, await mcping(Server.JAVA, address)),
	// 		adaptBedrockServerMeta(address, await mcping(Server.BEDROCK, address)),
	// 		timer.set(2000, '未找到指定服务器，可能是服务器不存在或响应超时'),
	// 	])
	// } finally {
	// 	timer.clear()
	// }
	// logger.info('res', res)
	return res as string
}