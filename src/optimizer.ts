import { resizeOptimize, resizeOptimizeColor, optimize as opt } from "./questionTypes"
import { File } from "./files"
import path from "path"
import sharp from "sharp"
import { platform, arch } from "process"
import { execShellCommand } from "./utils"
const apps: {
	[key: string]: {
		path: string
		platform: typeof platform
		arch: typeof arch[]
		formats: (keyof sharp.FormatEnum)[]
		getCmd: (
			file: string,
			level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
			format?: keyof sharp.FormatEnum
		) => string | null
	}
} = {
	pingo: {
		path: path.join(__dirname, "..", "optimizers", "pingo.exe"),
		platform: "win32",
		arch: ["x64"],
		formats: ["png", "jpeg", "jpg", "webp"],
		getCmd(file, level, format) {
			if (!Commands.check("pingo")) return null
			if (!format || !this.formats.includes(format)) return null
			const args: string[] = []
			if (level >= 6) {
				args.push("-strip")
			}
			return `"${this.path}" -s${level} ${args.join(" ")} "${file}"`
		},
	},
	optipng: {
		path: path.join(__dirname, "..", "optimizers", "optipng.exe"),
		platform: "win32",
		arch: ["x32"],
		formats: ["png", "gif", "tiff"],
		getCmd(file, level, format) {
			if (!Commands.check("optipng")) return null
			if (!format || !this.formats.includes(format)) return null
			const args: string[] = []
			if (level >= 9) {
				args.push("-zm1-9")
			}
			return `"${this.path}" -o${level <= 7 ? level : 7} ${args.join(" ")} "${file}"`
		},
	},
}
class Commands {
	static instance: Commands
	private constructor(public level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, lossy: boolean) {}
	static check(name: string) {
		if (apps[name] && apps[name].platform === platform && apps[name].arch.includes(process.arch)) return true
		return false
	}
	static getInstance(level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, lossy: boolean) {
		if (!this.instance) {
			this.instance = new Commands(level, lossy)
		}
		return this.instance
	}
	async start(source: string, metadata: sharp.Metadata) {
		for (const name in apps) {
			if (apps[name].platform === platform && apps[name].arch.includes(process.arch)) {
				const cmd = apps[name].getCmd(source, this.level, metadata.format)
				if (cmd) await execShellCommand(cmd).catch(console.error)
			}
		}
	}
}

export const optimize = async (
	source: string,
	task: File,
	Setting: resizeOptimizeColor | resizeOptimize | opt,
	metadata?: sharp.Metadata
) => {
	metadata = metadata ?? (await sharp(source).metadata())
	const commands = Commands.getInstance(Setting.optimization, Setting.lossy)
	await commands.start(source, metadata)
}

export default optimize
