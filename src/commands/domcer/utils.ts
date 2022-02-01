export class Checker {
	static isNotEmpty(value) {
		return typeof value !== 'undefined' ? true : undefined
	}

	static isInteger(number) {
		return isNaN(parseInt(number)) ? '参数必须为整数。' : undefined;
	}

	static isUserName(username) {
		username = String(username);
		if (!username || !username.length) return '请输入用户名。';
		if (username.length > 20 || username.length <= 0) return '用户名不合法。';
		return undefined;
	}

	static isMatchID(matchID) {
		if (matchID.length !== 8) return '对局 ID 的长度不正确。';
		if (!/^[0-9A-Z]+$/i.test(matchID)) return '对局 ID 不合法。';
		return undefined;
	}

	static isMegaWallsKit(name: string) {
		// const megaWallsKits = [
		// 	'凤凰'
		// ];
		// return megaWallsKits.includes(name);
		return undefined;
	}
};