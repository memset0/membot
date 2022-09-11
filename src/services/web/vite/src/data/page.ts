import { defineStore } from 'pinia'
import { PageData } from '../fetch'

export const usePageData = defineStore('pageData', {
	state: () => ({
		layout: 'loading',
		data: ({} as PageData['data']),
	}),
})