import * as request from 'superagent';

import config from '../../config';

export const root = 'http://api.domcer.com/';
export const key = config.domcer.key;

export async function get(uri, data = null) {
	data = data || {};
	if (!data.key) data.key = key;

	return (await request.get(root + uri).query(data)).res.text;
}

export async function getJSON(uri, data = null) {
	return JSON.parse(await get(uri, data));
}