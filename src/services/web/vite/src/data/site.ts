import { defineStore } from 'pinia'

export const useSiteData = defineStore('siteData', {
	state: () => ({
		logoUrl: 'http://q.qlogo.cn/headimg_dl?dst_uin=1470738407&spec=640',
	}),
})