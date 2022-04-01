import { resizeOptimize, resizeOptimizeColor, optimize as opt } from "./questionTypes"
import { Directory, File } from "./files"
import path from "path"
import sharp from "sharp"
import { platform, arch } from "process"
import { execShellCommand } from "./utils"
import Config from "./config"
const apps: {
	[key: string]: {
		path: string
		platform: typeof platform
		arch: typeof arch[]
		formats: (keyof sharp.FormatEnum)[]
		global: boolean
		start: (
			file: string,
			level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
			// format?: keyof sharp.FormatEnum
		) => Promise<void> | void
	}
} = {
	pingo: {
		path: path.join(__dirname, "..", "optimizers", "pingo.exe"),
		platform: "win32",
		arch: ["x64"],
		formats: ["png", "jpeg", "jpg", "webp"],
		global: true,
		async start(file, level) {
			if (!check("pingo")) return
			// if (!format || !this.formats.includes(format)) return null
			const args: string[] = []
			if (level >= 6) {
				args.push("-strip")
			}
			const cmd = `"${this.path}" -s${level} -noconversion -quiet ${args.join(" ")} "${file}"`
			await execShellCommand(cmd).catch(console.error)
			return
		},
	},
	// optipng: {
	// 	path: path.join(__dirname, "..", "optimizers", "optipng.exe"),
	// 	platform: "win32",
	// 	arch: ["x32"],
	// 	formats: ["png", "gif", "tiff"],
	// 	getCmd(file, level, format) {
	// 		if (!Commands.check("optipng")) return null
	// 		if (!format || !this.formats.includes(format)) return null
	// 		const args: string[] = []
	// 		if (level >= 9) {
	// 			args.push("-zm1-9")
	// 		}
	// 		return `"${this.path}" -o${level <= 7 ? level : 7} ${args.join(" ")} "${file}"`
	// 	},
	// },
}

const check = (name: string) => {
	if (apps[name] && apps[name].platform === platform && apps[name].arch.includes(process.arch)) return true
	return false
}
// export const optimize = async (
// 	source: string,
// 	task: File,
// 	Setting: resizeOptimizeColor | resizeOptimize | opt,
// 	metadata?: sharp.Metadata
// ) => {
// 	metadata = metadata ?? (await sharp(source).metadata())
// 	const commands = Commands.getInstance(Setting.optimization, Setting.lossy)
// 	await commands.start(source, metadata)
// }

export const optimizer = async (dir: Directory) => {
	const Settings = (await Config.getInstance()).get()
	if (Settings.action === 1) return
	const dirPath = path.resolve(dir.path)
	// start pingo
	await apps.pingo?.start(dirPath, Settings.optimization)
}

export default optimizer
