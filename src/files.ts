import { Stats } from "fs"
import { readdir, stat } from "fs/promises"
import path, {resolve} from "path"

// get all files in folder

export class Directory {
	files: (File | Directory)[] = []
	isEmpty: boolean = true
	isFile: false = false
	isDir: true = true
	pathAbsolute = resolve(this.path)
	constructor(public path: string, public stat: Stats) {}
	async read(deep = false, minSize = 0) {
		const files = await readdir(this.path).catch((err) => {
			console.log(`Error reading directory ${this.path}`)
			return [] as string[]
		})

		for (const file of files) {
			const filePath = path.join(this.path, file)
			const fileStat = await stat(filePath).catch(() => {})
			if (!fileStat) continue

			if (fileStat.isDirectory()) {
				const dir = new Directory(filePath, fileStat)
				this.files.push(dir)
				if (deep) await dir.read(deep, minSize)
			} else {
				if (fileStat.size <= minSize) continue
				this.files.push(new File(filePath, file, fileStat))
			}
		}
		if (this.files.length !== 0) this.isEmpty = false
		return this
	}
	getTotalSize(deep = false): number {
		let size = 0
		for (const file of this.files) {
			if (deep && file.isDir && !file.isEmpty) {
				size += file.getTotalSize(deep)
			} else if (file.isFile) {
				size += file.getSize()
			}
		}
		return size
	}
	//use path.join to get the full path
	getFiles(deep = false): { [path: string]: File } {
		const files: { [path: string]: File } = {}
		for (const file of this.files) {
			if (deep && file.isDir && !file.isEmpty) {
				const files2 = file.getFiles(deep)
				for (const key in files2) {
					files[key] = files2[key]
				}
			} else if (file.isFile) {
				files[file.path] = file
			}
		}
		return files
	}
	toString() {
		return this.pathAbsolute
	}
}
export class File {
	isFile: true = true
	isDir: false = false
	pathAbsolute = resolve(this.path)
	constructor(public path: string, public name: string, public stat: Stats) {}
	getSize() {
		return this.stat.size
	}
	toString() {
		return this.pathAbsolute
	}
}
