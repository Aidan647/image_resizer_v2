import { Directory } from "../dist/files"
import { questionConfig } from "../dist/questionTypes"
import { WorkerManager } from "../dist/WorkerManager"
import assert from "assert"
import Config from "../dist/config"
import fs from "fs/promises"
import path from "path"
import { data, resizer } from "../dist/resizer"
import utils from "../dist/utils"
import sharp from "sharp"

describe("Tests", function () {
	describe("utils", async () => {
		it("exists", async () => {
			assert.strictEqual(await utils.exists(__filename), true)
			assert.strictEqual(await utils.exists("./noFile.file"), false)
		})
		it("folder", async () => {
			assert.strictEqual(await utils.isFolder(__dirname), true)
			assert.strictEqual(await utils.isFolder(__filename), false)
			assert.strictEqual(await utils.isFolder("./noFolder"), false)
			assert.strictEqual(await utils.isFolder("./noFile.file"), false)
		})
		it("getAbsolutePathForTask", async () => {
			//@ts-ignore
			const set: questionConfig = {
				prefix: "p-",
				suffix: "-s",
				path: __dirname,
				path_out: __dirname,
			}
			assert.strictEqual(utils.getAbsolutePathForTask(set, __filename), path.join(__dirname, "p-test-s.js"))
		})
	})
	describe("Config", () => {
		const set: questionConfig = {
			core: 20,
			action: 3,
			lossy: false,
			optimization: 9,
			width: 100,
			height: 100,
			resizeMode: "contain",
			color: "FFF0",
			overwrite: true,
			quality: 90,
			compression: 9,
			prefix: "",
			suffix: "",
			path: path.join(__dirname, "input"),
			path_out: path.join(__dirname, "output"),
		}
		it("questionConfig", async () => {
			assert.deepStrictEqual((await Config.new(set)).get(), set)
		})
		it("getInstance", async () => {
			assert.strictEqual(Config.instance, undefined, "Config.instance present before creation")
			assert.strictEqual(
				await Config.getInstance(set),
				await Config.getInstance(set),
				"Config.getInstance not the same"
			)
			assert.notStrictEqual(Config.instance, undefined, "Config.instance not present after creation")
		})
		it("new/getInstance", async () => {
			assert.notStrictEqual(await Config.getInstance(set), await Config.new(set))
		})
	})
	describe("App", () => {
		describe("resizer", () => {
			const Settings: questionConfig = {
				core: 20,
				action: 3,
				lossy: false,
				optimization: 9,
				width: 100,
				height: 100,
				resizeMode: "contain",
				color: "FFF0",
				overwrite: true,
				quality: 90,
				compression: 9,
				prefix: "",
				suffix: "",
				path: path.join(__dirname, "images", "input"),
				path_out: path.join(__dirname, "images", "output"),
			}
			const images = ["200x1000.png", "1000x200.png", "1000x1000.png"]
			const tests: ["cover" | "fill" | "inside" | "outside", { w: number; h: number }[]][] = [
				[
					"cover",
					[
						{ w: 100, h: 100 },
						{ w: 100, h: 100 },
						{ w: 100, h: 100 },
					],
				],
				[
					"fill",
					[
						{ w: 100, h: 100 },
						{ w: 100, h: 100 },
						{ w: 100, h: 100 },
					],
				],
				[
					"inside",
					[
						{ w: 20, h: 100 },
						{ w: 100, h: 20 },
						{ w: 100, h: 100 },
					],
				],
				[
					"outside",
					[
						{ w: 100, h: 500 },
						{ w: 500, h: 100 },
						{ w: 100, h: 100 },
					],
				],
			]
			var dir: Directory

			before(async () => {
				const stat = await fs.stat(Settings.path)
				dir = await new Directory(Settings.path, stat).read(true)
				// clear output folder before test
				await fs.rm(Settings.path_out, { recursive: true })
			})

			tests.forEach((test) => {
				it(test[0], async () => {
					const set: questionConfig = {
						...Settings,
						prefix: test[0],
						resizeMode: test[0],
					}
					await new WorkerManager<data>(set.core, Object.values(dir.getFiles(true)), resizer).start({
						Settings: set,
					})
					for (const index in images) {
						const image = images[index]
						const file = path.join(__dirname, "images", "output", test[0] + image)
						const metadata = await sharp(file).metadata()
						assert.deepStrictEqual(
							{ w: metadata.width, h: metadata.height },
							test[1][index],
							"image " + image + " is not resized correctly"
						)
					}
				})
			})
			//TODO test for contain and color
			// it("cover", async () => {
			// 	const set: questionConfig = {
			// 		...Settings,
			// 		prefix: "cover",
			// 		resizeMode: "cover",
			// 		width: 100,
			// 		height: 100,
			// 	}
			// 	const worker = new WorkerManager<data>(set.core, Object.values(dir.getFiles(true)), resizer)
			// 	await worker.start({ Settings: set })
			// 	//test images are 100x100px
			// 	for (const image of images) {
			// 		const file = path.join(__dirname, "images", "output", "cover" + image)
			// 		const metadata = await sharp(file).metadata()
			// 		assert.strictEqual(metadata.width, 100, `cover${image} width is not 100px`)
			// 		assert.strictEqual(metadata.height, 100, `cover${image} height is not 100px`)
			// 	}
			// })
		})
	})
})
//{"core":20,"action":3,"lossy":false,"optimization":9,"width":100,"height":200,"resizeMode":"contain","color":"FFF0","overwrite":true,"quality":90,"compression":9,"prefix":"p-","suffix":"-s","path":"graphics","path_out":"d2"}
