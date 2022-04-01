import fs from "fs/promises"
import path from "path"
import { questionConfig } from "./questionTypes"
import { exec } from "child_process"

export const isFolder = async (path: string) => {
	return fs.stat(path).then(
		(stat) => {
			return stat.isDirectory()
		},
		() => false
	)
}
export const exists = async (path: string) => {
	return fs.stat(path).then(
		() => true,
		() => false
	)
}

export const getAbsolutePathForTask = (Settings: questionConfig, source: string) => {
	var ext_name = path.extname(source)
	// @ts-ignore
	if (Settings.formatForce) {
		// @ts-ignore
		ext_name = "." + Settings.formatForce
	}
	const taskPathName =
		Settings.prefix + path.basename(source).replace(path.extname(source), Settings.suffix + ext_name)
	const outPath = path.resolve(
		path.join(Settings.path_out, path.relative(Settings.path, path.join(path.dirname(source), taskPathName)))
	)
	return outPath
}
export const execShellCommand = (cmd: string): Promise<string> => {
	return new Promise<string>((resolve, reject) => {
		exec(cmd, (error, stdout, stderr) => {
			if (error) {
				reject(stderr)
			}
			resolve(stdout)
		})
	})
}
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
export const tr: {
	locale: string
	file: string
	data: { [key: string]: string }
	setLocale: (locale: string) => Promise<void>
	get: (key: string, data?: { [key: string]: string }) => string
} = {
	locale: "",
	file: "",
	data: {},
	async setLocale(locale: string) {
		this.locale = locale
		this.file = path.join(__dirname, "..", "languages", locale + ".json")
		try {
			if (await exists(this.file)) {
				await fs.readFile(this.file, "utf8").then((std) => {
					this.data = JSON.parse(std)
				})
			} else {
				await fs.writeFile(this.file, "")
				this.setLocale("en-US")
			}
		} catch (e) {}
	},
	get(key, data = {}) {
		if (this.data[key] != undefined) {
			let txt = this.data[key]
			for (let i in data) {
				txt = txt.replace(i, data[i])
			}
			return txt
		}
		return key
	},
}

export default { isFolder, exists, getAbsolutePathForTask, execShellCommand, delay, tr }
