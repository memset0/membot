export function isInteger(obj: any): boolean {
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

export function isValidDate(date: any): boolean {
	return date && !isNaN(Date.parse((new Date(date)) as unknown as string))
}

export function deepCopy<T>(target: T): T {
	if (target === null) {
		return target
	}
	if (target instanceof Date) {
		return new Date(target.getTime()) as any
	}
	if (target instanceof Array) {
		const cp = [] as any[]
		(target as any[]).forEach((v) => { cp.push(v) })
		return cp.map((n: any) => deepCopy<any>(n)) as any
	}
	if (typeof target === 'object') {
		const cp = { ...(target as { [key: string]: any }) } as { [key: string]: any }
		Object.keys(cp).forEach(k => {
			cp[k] = deepCopy<any>(cp[k])
		})
		return cp as T
	}
	return target
}