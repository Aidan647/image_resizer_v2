#! /usr/bin/env node

import fs from "fs/promises"
import Config from "./config"
import {delay} from "./utils"
import { Directory } from "./files"
import WorkerManager from "./WorkerManager"
import cliProgress from "cli-progress"
import resizer, { data } from "./resizer"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { getAbsolutePathForTask, isFolder } from "./utils"
import path from "path"
import {optimizer} from "./optimizer"

const SupportedOS: typeof process.platform[] = ["win32", "linux"]
if (!SupportedOS.includes(process.platform)) {
	console.log("Unsupported OS")
	process.exit(1)
}
const loadArgs = () => {
	return (
		yargs(hideBin(process.argv))
			.usage("Usage: scan-for-duplicates [options]")
			// deep scan
			.option("time", {
				alias: "t",
				describe: "show run time",
				type: "boolean",
				default: false,
			})
			.parse()
	)
}
;(async () => {
	const argv = await loadArgs()
	const config = await Config.getInstance()
	const sizes = { start: -1, middle: -1, end: -1 }
	const Settings = config.get()
	if (argv.time) console.time("Total time")
	if (Settings.action !== 2) {
		if (argv.time) console.time("Resize time")
		console.log("Resizing...")
		const dir = await new Directory(Settings.path, await fs.stat(Settings.path)).read(true)
		sizes.start = dir.getTotalSize(true)
		const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
		bar.start(Object.values(dir.getFiles(true)).length, 0)

		const worker = new WorkerManager<data>(Settings.core, Object.values(dir.getFiles(true)), resizer)
		await worker.start({ Settings, bar })

		await delay(10)
		bar.render()
		bar.stop()
		if (argv.time) console.timeEnd("Resize time")
	}
	if (Settings.action === 3)
		sizes.middle = (
			await new Directory(Settings.path_out, await fs.stat(Settings.path_out)).read(true)
		).getTotalSize(true)
	if (Settings.action !== 1) {
		const dir = await new Promise<Directory>(async (resolve) => {
			if (Settings.action !== 2 && Settings.path_out !== "") {
				resolve(new Directory(Settings.path, await fs.stat(Settings.path)).read(true))
				return
			}
			//copy files to output directory
			console.log("Copying files...")
			const dir = await new Directory(Settings.path, await fs.stat(Settings.path)).read(true)
			const files = dir.getFiles(true)
			const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
			bar.start(Object.values(files).length, 0)
			const worker = new WorkerManager<data>(Settings.core, Object.values(files), async (data, { Settings }) => {
				const outPath = getAbsolutePathForTask(Settings, data.path)
				if (!(await isFolder(path.dirname(outPath)))) {
					await fs.mkdir(path.dirname(outPath), { recursive: true })
				}
				await fs.copyFile(data.pathAbsolute, outPath)
				bar.increment()
			})
			await worker.start({ Settings })
			bar.render()
			bar.stop()
			resolve(new Directory(Settings.path_out, await fs.stat(Settings.path_out)).read(true))
			return
		})
		console.log("Optimizing...")
		if (argv.time) console.time("Optimize time")
		await optimizer(dir)
		if (argv.time) console.timeEnd("Optimize time")
	}
	const resultPath = Settings.path_out === "" ? Settings.path : Settings.path_out
	sizes.end = (await new Directory(resultPath, await fs.stat(resultPath)).read(true)).getTotalSize(true)


	console.log(`Total size: ${sizes.start} -> ${sizes.middle !== -1 ? `${sizes.middle} ->` : ""} ${sizes.end}`)
	// => response => { username, age, about }
})()
