export default function (data: any, { Column }) {
	const res = []
	res.push(`共有 ${data.length} 篇笔记`)
	res.push(data.url)
	return res.join('\n')
}