import { File } from "./files"
import { questionConfig } from "./questionTypes"
import { SingleBar } from "cli-progress"
import { exists, isFolder, getAbsolutePathForTask } from "./utils"
import path from "path"
import sharp from "sharp"
import fs from "fs/promises"
import optimize from "./optimizer"

export type data = {
	Settings: questionConfig
	bar?: SingleBar
}
export const resizer = async (task: File, data: data) => {
	const Settings = data.Settings
	data?.bar?.increment()
	const outPath = getAbsolutePathForTask(Settings, task.path)
	if (!Settings.overwrite && (await exists(path.dirname(outPath)))) {
		return
	}
	const folderCreation = new Promise<void>(async (resolve, reject) => {
		if (!(await isFolder(path.dirname(outPath)))) {
			await fs.mkdir(path.dirname(outPath), { recursive: true })
		}
		resolve()
	}).catch(() => {})
	if (Settings.action === 2) {
		await folderCreation
		await fs.copyFile(task.pathAbsolute, outPath).then(() => {
			return optimize(outPath, task, Settings)
		}).catch(console.error)
		return
	}
	const file = sharp(task.pathAbsolute)
	file.resize({
		height: Settings.height === 0 ? undefined : Settings.height,
		width: Settings.width === 0 ? undefined : Settings.width,
		fit: Settings.resizeMode,
		background: Settings.resizeMode === "contain" ? "#" + Settings.color : undefined,
	})
	const metadata = await file.metadata()
	if (metadata.format === "jpeg") {
		file.jpeg({ quality: Settings.quality })
	}
	if (metadata.format === "png") {
		file.png({ compressionLevel: Settings.compression })
	}
	if (metadata.format === "webp") {
		file.webp({ quality: Settings.quality })
	}
	if (metadata.format === "tiff") {
		file.tiff({ quality: Settings.quality })
	}
	await folderCreation
	await file.toFile(outPath).then(() => {
		if (Settings.action === 3) return optimize(outPath, task, Settings, metadata)
	}).catch(() => {
		console.log(`Error resizing ${task.path}`)
	})
}
export default resizer