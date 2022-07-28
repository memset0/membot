import tmp from 'tmp'


export interface TempFile {
	path: string
	fd: number
	callback: () => void
}

export interface TempFolder {
	path: string
	callback: () => void
}

export type TempFileOptions = tmp.FileOptions
export type TempFolderOptions = tmp.DirOptions


export async function createTempFile(options: TempFileOptions = {}): Promise<TempFile> {
	return new Promise((resolve, reject) => {
		tmp.file(options, (err, path, fd, callback) => {
			if (err) {
				reject(err)
			} else {
				resolve({ path, fd, callback } as TempFile)
			}
		})
	})
}

export async function createTempFolder(options: TempFolderOptions = {}): Promise<TempFolder> {
	return new Promise((resolve, reject) => {
		tmp.dir(options, function _tempDirCreated(err, path, callback) {
			if (err) {
				reject(err)
			} else {
				resolve({ path, callback } as TempFolder)
			}
		})
	})
}