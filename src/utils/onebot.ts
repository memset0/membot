import * as qface from 'qface'

export class QFace {
	public static idToDes(id) {
		return qface.get(id).QDes
	}
	public static idToUrl(id) {
		return qface.getUrl(id, 'https://qq-face.vercel.app')
	}
}