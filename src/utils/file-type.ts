import sharp from 'sharp'
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'

import { createTempFile } from './tmp'

export namespace FileConverter {
	export async function takeVideoShortcut(videoPath: string, imagePath: string, options: any = {}): Promise<void> {
		const {
			quality = 3,
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
			cmd.inputOptions(inputOptions)
				.outputOptions(outputOptions)
				.output(imagePath)
				.on('end', () => resolve())
				.on('error', (err: Error) => reject(err))
				.run()
		})
	}


	export async function convertVideo(sourcePath: string, targetPath: string): Promise<void> {
		return new Promise((resolve, reject) => {
			ffmpeg(sourcePath)
				.save(targetPath)
				.format('avi')
				.on('end', () => resolve())
				.on('error', (err: Error) => reject(err))
				.run()
		})
	}
}



export namespace BufferConverter {
	export async function takeVideoShortcut(buffer: Buffer, videoFormat: string = 'mp4', imageFormat: string = 'jpg'): Promise<Buffer> {
		const video = await createTempFile({ postfix: `.${videoFormat}` })
		const image = await createTempFile({ postfix: `.${imageFormat}` })
		await fs.promises.writeFile(video.path, buffer, 'binary')
		await FileConverter.takeVideoShortcut(video.path, image.path, { videoFormat })
		const result = await fs.promises.readFile(image.path)
		video.callback()
		image.callback()
		return result
	}


	export async function convertVideo(buffer: Buffer, sourceFormat: string, targetFormat: string): Promise<Buffer> {
		const sourceVideo = await createTempFile({ postfix: `.${sourceFormat}` })
		const targetVideo = await createTempFile({ postfix: `.${targetFormat}` })
		await fs.promises.writeFile(sourceVideo.path, buffer, 'binary')
		await FileConverter.convertVideo(sourceVideo.path, targetVideo.path)
		const result = await fs.promises.readFile(targetVideo.path)
		sourceVideo.callback()
		targetVideo.callback()
		return result
	}


	export async function webp2jpg(buffer: Buffer): Promise<Buffer> {
		return await sharp(buffer)
			.flatten({ background: { r: 255, g: 255, b: 255 } })
			.jpeg()
			.toBuffer()
	}

	export async function webm2jpg(buffer: Buffer): Promise<Buffer> {
		return takeVideoShortcut(buffer, 'webm')
	}

	export async function mp42jpg(buffer: Buffer): Promise<Buffer> {
		return takeVideoShortcut(buffer, 'mp4')
	}

	export async function gif2jpg(buffer: Buffer): Promise<Buffer> {
		return takeVideoShortcut(buffer, 'gif')
	}

	export async function webm2gif(buffer: Buffer): Promise<Buffer> {
		return convertVideo(buffer, 'webm', 'gif')
	}

	export async function mp42gif(buffer: Buffer): Promise<Buffer> {
		return convertVideo(buffer, 'mp4', 'gif')
	}
}