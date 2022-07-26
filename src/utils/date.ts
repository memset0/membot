declare global {
	interface Date {
		format: (fmt: string) => string
		toChineseString(): () => string
		toChineseDateString(): () => string
	}
}

Date.prototype.format = function (fmt: string) {
	const o = {
		"M+": this.getMonth() + 1,
		"d+": this.getDate(),
		"h+": this.getHours(),
		"m+": this.getMinutes(),
		"s+": this.getSeconds(),
		"q+": Math.floor((this.getMonth() + 3) / 3),
		"S": this.getMilliseconds(),
	}
	if (/(y+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length))
	}
	for (var k in o) {
		if (new RegExp("(" + k + ")").test(fmt)) {
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)))
		}
	}
	return fmt
}

Date.prototype.toChineseDateString = function () {
	return this.format('yyyy年M月d日')
}

Date.prototype.toChineseString = function () {
	return this.format('yyyy年M月d日 hh:mm:ss')
}

export { }