export class Checker {
	static isTrue(value) {
		return !value ? '参数不存在' : undefined
	}

	static isNumber(number) {
		return isNaN(number) ? '参数不是 Javscript 标准下的数字' : undefined
	}

	static isNotEmpty(value) {
		return typeof value !== 'undefined' ? true : undefined
	}

	static isInteger(number) {
		return isNaN(parseInt(number)) ? '参数必须为整数' : undefined
	}

	static isUserName(username) {
		username = String(username)
		if (!username || !username.length) return '请输入用户名'
		if (username.length > 20 || username.length <= 0) return '用户名不合法'
		return undefined
	}

	static isMatchID(matchID) {
		if (matchID.length !== 8) return '对局 ID 的长度不正确'
		if (!/^[0-9A-Z]+$/i.test(matchID)) return '对局 ID 不合法'
		return undefined
	}

	static isRatio(value) {
		value = parseFloat(String(value))
		if (isNaN(value)) {
			return '取样比例应是一个实数'
		}
		if (value <= 0 || value > 1) {
			return '取样比例应在(0,1]的范围内'
		}
		return undefined
	}

	static isMegaWallsKit(name: string) {
		// const megaWallsKits = [
		// 	'凤凰'
		// ]
		// return megaWallsKits.includes(name)
		return undefined
	}
}