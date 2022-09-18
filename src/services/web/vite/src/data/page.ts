import { defineStore } from 'pinia'
import { PageData } from '../types'

export const usePageData = defineStore('pageData', {
	state: () => ({
		id: '',
		layout: 'loading',
		user: undefined,
		channel: undefined,
		data: ({} as PageData['data']),
	} as PageData),
})