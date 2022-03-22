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
			.option("test", {
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
	const Settings = config.get()
	if (argv.test) console.time("test")
	const dir = await new Directory(Settings.path, await fs.stat(Settings.path)).read(true)
	const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
	bar.start(Object.values(dir.getFiles(true)).length, 0)
	const worker = new WorkerManager<data>(Settings.core, Object.values(dir.getFiles(true)), resizer)
	await worker.start({ Settings, bar })
	await delay(10)
	bar.render()
	bar.stop()
	if (argv.test) console.timeEnd("test")
	// => response => { username, age, about }
})()
