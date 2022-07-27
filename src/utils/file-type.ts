import sharp from 'sharp'
import * as fs from 'fs'
import * as tmp from 'tmp'
import ffmpeg from 'fluent-ffmpeg'

import { createTempFile, createTempFolder } from './tmp'


export async function videoExtractFrame(videoPath: string, imagePath: string, options: any = {}): Promise<void> {
	const {
		log = () => { },
		quality = 2,
		offset = 0,
		noaccurate = false,
	} = options;

	return new Promise((resolve, reject) => {
		let cmd = ffmpeg(videoPath)
		const inputOptions = []
		if (noaccurate) {
			inputOptions.push('-ss', offset / 1000)
			inputOptions.push('-noaccurate_seek')
		} else {
			cmd.seek(offset / 1000)
		}
		const outputOptions = [
			'-vframes', 1,
			'-q:v', quality,
		]
		console.log({ inputOptions, outputOptions })
		cmd.inputOptions(inputOptions)
			.outputOptions(outputOptions)
			.output(imagePath)
			.on('start', (cmd: any) => log && log({ cmd }))
			.on('end', () => resolve())
			.on('error', (err: Error) => reject(err))
			.run()
	})
}


export async function video2jpg(buffer: Buffer, videoFormat: string): Promise<Buffer> {
	const video = await createTempFile({ postfix: `.${videoFormat}` })
	const image = await createTempFile({ postfix: '.jpg' })
	console.log(video, image)
	await fs.promises.writeFile(video.path, buffer, 'binary')
	await videoExtractFrame(video.path, image.path, { videoFormat })
	return await fs.promises.readFile(image.path)
}


export async function webp2jpg(buffer: Buffer): Promise<Buffer> {
	return await sharp(buffer)
		.flatten({ background: { r: 255, g: 255, b: 255 } })
		.jpeg()
		.toBuffer()
}

export async function webm2jpg(buffer: Buffer): Promise<Buffer> {
	return video2jpg(buffer, 'webm')
}

export async function mp42jpg(buffer: Buffer): Promise<Buffer> {
	return video2jpg(buffer, 'mp4')
}