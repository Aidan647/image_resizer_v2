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
	const taskPathName =
		Settings.prefix + path.basename(source).replace(path.extname(source), Settings.suffix + path.extname(source))
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
export default { isFolder, exists, getAbsolutePathForTask, execShellCommand}

