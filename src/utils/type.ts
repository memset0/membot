export function isInteger(obj: any) {
	if (typeof obj === 'number') {
		return Number.isInteger(obj)
	}
	if (typeof obj == 'string') {
		obj = parseInt(obj)
		if (isNaN(obj)) { return false }
		return Number.isInteger(obj)
	}
	return false
}