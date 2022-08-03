export function sliceWithEllipsis(input: string, lim: number, ellipsis: string = '...') {
	if (input.length > lim) {
		return input.slice(0, lim - ellipsis.length) + ellipsis
	} else {
		return input
	}
}


export function escapeTelegramHTML(content: string): string {
	return content
		.replace(/\&/g, '&amp;')
		.replace(/\</g, '&lt;')
		.replace(/\>/g, '&gt;')
}

export function unescapeTelegramHTML(content: string): string {
	return content
		.replace(/\&amp\;/g, '&')
		.replace(/\&lt\;/g, '<')
		.replace(/\&gt\;/g, '>')
}


export function escapeCqCode(content: string): string {
	return content
		.replace(/\&/g, '&amp;')
		.replace(/\[/g, '&#91;')
		.replace(/\]/g, '&#93;')
}

export function unescapeCqCode(content: string): string {
	return content
		.replace(/&#91;/g, '[')
		.replace(/&#93;/g, ']')
		.replace(/&amp;/g, '&')
}