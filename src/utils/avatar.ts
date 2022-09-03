export function getUserAvatar(platform: string, userId: string): null | string {
	switch (platform) {
		case 'onebot': {
			return `https://q.qlogo.cn/headimg_dl?dst_uin=${userId}&spec=640`
		}
	}
	return null
}

export function getChannelAvatar(platform: string, channelId: string): null | string {
	if (channelId.startsWith('private:')) {
		return getUserAvatar(platform, channelId.slice(8))
	}
	switch (platform) {
		case 'onebot': {
			return `https://p.qlogo.cn/gh/${channelId}/${channelId}/0`
		}
	}
	return null
}