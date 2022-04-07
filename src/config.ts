import prompts                from "prompts"
import fs                     from "fs/promises"
import path                   from "path"
import os                     from "os"
import {exists, isFolder, tr} from "./utils"
import {questionConfig}       from "./questionTypes"
import yargs                  from "yargs"
import {hideBin}              from "yargs/helpers"
import {osLocale}             from "os-locale-s"

const loadArgs = async () => {
	return yargs(hideBin(process.argv))
		.option("config", {
			alias   : "c",
			describe: "Path to config file",
			type    : "string",
			default : "./img_res_config.json",
		})
		.parse()
}
type UnboxPromise<T extends Promise<any>> = T extends Promise<infer U> ? U : never

export class Config {
	static instance: Config
	ready: Promise<void>
	argv!: UnboxPromise<ReturnType<typeof loadArgs>>
	config: questionConfig = {} as questionConfig
	private constructor(config?: questionConfig) {
		if (config) this.config = config
		this.ready = new Promise<void>((resolve) => {
			if (!config) this.init(resolve)
			else resolve()
		})
	}
	static async getInstance(config?: questionConfig) {
		if (!Config.instance) {
			Config.instance = new Config(config)
		}
		await Config.instance.ready
		return Config.instance
	}
	static async new(config?: questionConfig) {
		const inst = new Config(config)
		await inst.ready
		return inst
	}

	async init(resolve: (value: PromiseLike<void> | void) => void) {
		this.argv = await loadArgs()
		if (!(await this.loadFromFile())) {
			await this.question()
		}
		resolve()
	}
	async loadFromFile() {
		const config = this.argv.config ?? "./img_res_config.json"
		if (await exists(config)) {
			this.config = JSON.parse(await fs.readFile(config, "utf8"))
			return true
		}
		return false
	}
	async saveToFile() {
		await fs.writeFile("./img_res_config.json", JSON.stringify(this.config))
	}
	async question() {
		try {
			const lang = await osLocale()
			await tr.setLocale(lang)
			this.config.core   = (
				await prompts({
								  type   : "number",
								  name   : "core",
								  message: tr.get("core"),
								  initial: os.cpus().length || 1,
								  min    : 1,
							  })
			).core
			this.config.action = (
				await prompts({
								  type   : "select",
								  name   : "action",
								  message: tr.get("action"),
								  // hint: "Never optimize images without backup",
								  choices: [
									  {title:  tr.get("resize"), value: 1},
									  // { title: "optimize", value: 2 },
									  // { title: "resize & optimize", value: 3 },
								  ],
								  initial: 0,
							  })
			).action
			if (this.config.action !== 1) {
				// this.config.lossy = (
				// 	await prompts({
				// 					  type   : "toggle",
				// 					  active : "yes",
				// 					  name   : "lossy",
				// 					  message: tr.get("lossy"),
				// 					  initial: false,
				// 				  })
				// ).lossy

				this.config.optimization = (
					await prompts({
									  type   : "number",
									  name   : "optimization",
									  message: tr.get("optimization"),
									  initial: 7,
									  min    : 0,
									  max    : 9,
								  })
				).optimization
			}
			if (this.config.action !== 2) {
				this.config.width  = (
					await prompts({
									  type   : "number",
									  name   : "width",
									  message: tr.get("width"),
									  hint   : tr.get("width_hint"),
									  initial: 0,
									  min    : 0,
								  })
				).width
				this.config.height = (
					await prompts({
									  type    : "number",
									  name    : "height",
									  message : tr.get("height"),
									  hint    : tr.get("height_hint"),
									  initial : 0,
									  min     : 0,
									  validate: (v) => {
										  if (this.config.action === 2) return "Ебаный в рот этого казино, блять, restart app"
										  if (this.config.width === 0 && v === 0) return "Width and height cannot both be 0"
										  return true
									  },
								  })
				).height
				if (this.config.width !== 0 && this.config.height !== 0) {
					this.config.resizeMode = (
						await prompts({
										  type   : "select",
										  name   : "resizeMode",
										  message: tr.get("resizeMode"),
										  choices: [
											  {
												  title      : tr.get("contain"),
												  value      : "contain",
												  description: tr.get("contain_description"),
											  },
											  {
												  title      : tr.get("cover"),
												  value      : "cover",
												  description: tr.get("cover_description"),
											  },
											  {
												  title      : tr.get("fill"),
												  value      : "fill",
												  description: tr.get("fill_description"),
											  },
											  {
												  title      : tr.get("inside"),
												  value      : "inside",
												  description:tr.get("inside_description"),
											  },
											  {
												  title      : tr.get("outside"),
												  value      : "outside",
												  description: tr.get("outside_description"),
											  },
										  ],
										  initial: 0,
									  })
					).resizeMode
					if (this.config.resizeMode === "contain") {
						this.config.color = (
							await prompts({
											  type    : "text",
											  name    : tr.get("color"),
											  message : tr.get("color_message"),
											  hint    :tr.get("color_hint") ,
											  initial : "FFF0",
											  validate: (path: string) => {
												  if (/^([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(path)) return true
												  if (/[^0-9a-f]/i.test(path)) return "Contains invalid characters"
												  if (![3, 4, 6, 8].includes(path.length)) return "Invalid length"
												  return "Invalid color"
											  },
										  })
						).color
					}
				}
			}
			this.config.overwrite = (
				await prompts({
								  type    : "toggle",
								  active  : "yes",
								  inactive: "no",
								  name    : "overwrite",
								  message : tr.get("overwrite"),
								  initial : false,
							  })
			).overwrite
			if (this.config.action !== 2) {
				this.config.formatForce = (
					await prompts({
									  type   : "select",
									  name   : "formatForce",
									  message: tr.get("formatForce"),
									  choices: [
										  {
											  title      : "default",
											  value      : null,
											  description: tr.get("formatForce_default_description"),
										  },
										  {
											  title      : "png",
											  value      : "png",
											  description:tr.get("formatForce_png_description")
										  },
										  {
											  title      : "jpg",
											  value      : "jpg",
											  description:tr.get("formatForce_jpg_description"),
										  },
										  {
											  title      : "webp",
											  value      : "webp",
											  description:tr.get("formatForce_webp_description"),
										  },
									  ],
									  initial: 0,
								  })
				).formatForce
				if (this.config.formatForce === "jpg" || this.config.formatForce === "webp" || this.config.formatForce === null) {
					this.config.quality = (
						await prompts({
										  type   : "number",
										  name   : "quality",
										  message: tr.get("quality"),
										  initial: this.config.formatForce === "webp" ? 100 : 90,
										  min    : 0,
										  max    : 100,
									  })
					).quality
				} else this.config.quality = 95
				if (this.config.formatForce === "png" || this.config.formatForce === null) {
					this.config.compression = (
						await prompts({
										  type   : "number",
										  name   : "compression",
										  message: tr.get("compression"),
										  initial: 6,
										  min    : 0,
										  max    : 9,
									  })
					).compression
				} else this.config.compression = 6
			}

			await prompts([
							  {
								  type   : "text",
								  name   : "prefix",
								  message: tr.get("prefix"),
								  initial: "",
							  },
							  {
								  type   : "text",
								  name   : "suffix",
								  message: tr.get("suffix"),
								  initial: "",
							  },
						  ]).then((response) => {
				this.config.prefix = response.prefix
				this.config.suffix = response.suffix
			})
			this.config.path     = (
				await prompts({
								  type    : "text",
								  name    : "path",
								  message : tr.get("path"),
								  validate: async (Path: string) => {
									  if (Path.length === 0) return "Can't be empty"
									  return (await isFolder(Path)) || "Folder not found"
								  },
							  })
			).path
			this.config.path_out = (
				await prompts({
								  type    : "text",
								  name    : "path_out",
								  message : tr.get("path_out"),
								  hint    :
									  this.config.action === 2
									  ? "Leave blank to optimize images in place"
									  : path.join(path.dirname(this.config.path), "output"),
								  validate: async (Path: string) => {
									  if (this.config.action === 2 && Path.length === 0) return true
									  if (Path.length === 0) return "Can't be empty"
									  if (path.relative(".", Path) === "") return "Can't be same as current folder"
									  if (path.relative(Path, this.config.path) === "") return "Can't be same as input folder"
									  if (path.resolve(Path).startsWith(path.resolve(this.config.path)))
										  return "Can't be inside input folder"
									  if (path.resolve(this.config.path).startsWith(path.resolve(Path)))
										  return "Input folder can't be inside output folder"
									  return true
								  },
							  })
			).path_out
			const save           = (await prompts({
													  type    : "toggle",
													  active  : "yes",
													  inactive: "no",
													  name    : "save",
													  message : tr.get("save"),
													  hint    : " - will be saved in img_res_config.json",
													  initial : false,
												  })
			).save
			if (save) {
				this.saveToFile()
			}
		} catch (e) {
			console.log(tr.get("error"))
			process.exit(1)
		}
	}

	get() {
		return this.config
	}
}
export default Config
