import axios from 'axios'
import config from './config'

export interface PageData {
	layout: string
	data: any
}

export function pageError(code: number, message?: string): PageData {
	if (code === 404 && !message) { message = 'Not Found' }

	return {
		layout: 'error',
		data: {
			code,
			message
		}
	}
}

export default async function fetch(): Promise<PageData> {
	let apiHost = window.location.protocol + '//' + window.location.host
	if (config.devHost && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
		apiHost = config.devHost
	}

	let id: string
	if (window.location.search) {
		for (const args of window.location.search.substring(1).split('&')) {
			const pair = args.split('=', 2)
			if (pair[0] === 'id') {
				id = pair[1]
			}
		}
	}
	if (!id) {
		if (window.location.pathname === '/') {
			id = 'home'
		} else if (window.location.pathname.startsWith('/') && !window.location.pathname.slice(1).includes('/')) {
			id = window.location.pathname.slice(1)
		}
	}

	if (!id) {
		return pageError(404)
	}

	const apiUrl = `${apiHost}${config.apiRoot}/get/${id}`
	console.log('[fetch]', apiUrl)
	const res = await axios.get(apiUrl)

	if (res.status !== 200) {
		return pageError(res.status, res.statusText)
	} else if (res.data === 404) {
		return pageError(404)
	}

	return res.data as unknown as PageData
}