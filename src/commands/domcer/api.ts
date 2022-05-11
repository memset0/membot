import * as request from 'superagent';

let root: string, key: string;

export function initSpider(_root: string, _key: string) {
	root = _root;
	key = _key;
}

export async function get(uri: string, data = null) {
	data = data || {};
	if (!data.key) data.key = key;
	if (data.uuid) data.uuid = String(data.uuid);
	if (data.name) data.name = String(data.name);

	if (data.name == '虎牙搜慕暝') {
		data.name = '虎牙搜靳乐';
	} else if (data.name == '虎牙搜靳乐') {
		data.name = '虎牙搜慕暝';
	}


	const rsp = await request.get(root + uri).query(data);
	return rsp.text;
}

export async function getJSON(uri: string, data = null) {
	return JSON.parse(await get(uri, data));
}