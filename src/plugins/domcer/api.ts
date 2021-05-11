import * as request from 'superagent';

let root: string, key: string;

export function initSpider(_root: string, _key: string) {
	root = _root;
	key = _key;
}

export async function get(uri: string, data = null) {
	data = data || {};
	if (!data.key) data.key = key;

	return (await request.get(root + uri).query(data)).res.text;
}

export async function getJSON(uri: string, data = null) {
	return JSON.parse(await get(uri, data));
}