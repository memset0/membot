export default class Checker {
	static isTrue(value) {
		return !value ? '参数不存在' : undefined;
	}

	static isNumber(number) {
		return isNaN(number) ? '参数不是 Javscript 标准下的数字' : undefined;
	}

	static isInteger(integer) {
		return isNaN(parseInt(integer)) ? '参数不是 Javascript 标准下的整数' : undefined;
	}

};