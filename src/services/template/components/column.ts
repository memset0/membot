export default function (data: { [K: string]: any }): string {
	let res = ''
	// let first = false
	// let separtor = ''
	for (const key in data) {
		// if (first) {
		// 	res += separtor
		// } else {
		// 	first = true
		// }
		res += `「${key}」${data[key]}`
	}
	return res
}