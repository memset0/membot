export function sliceWithEllipsis(input: string, lim: number, ellipsis: string = '...') {
	if (input.length > lim) {
		return input.slice(0, lim - ellipsis.length) + ellipsis
	} else {
		return input
	}
}