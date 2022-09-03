export default function (data: any, { Column }) {
	if (!data.length) {
		return '还没有笔记呢'
	}

	const res = []
	res.push(`共有 ${data.length} 篇笔记`)
	res.push(data.url)
	return res.join('\n')
}