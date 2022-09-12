import { defineStore } from 'pinia'
import { PageData } from '../fetch'

export const usePageData = defineStore('pageData', {
	state: () => ({
		id: '',
		layout: 'loading',
		data: ({} as PageData['data']),
	} as PageData),
})