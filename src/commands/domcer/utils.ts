export function codeErrorMessage(statusCode) {
	let res = `接口返回: ${statusCode}`
	if (statusCode === 401) {
		res += '（未找到该用户，请确认用户名及大小写是否正确）'
	} else if (statusCode == - 404) {
		res += '（可能原因：该用户 / 对局不存在）'
	} else if (statusCode === 500) {
		res += '（可能原因：API 访问次数达到上限）'
	}

	return res
}