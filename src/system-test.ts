const SupportedOS: typeof process.platform[] = ["win32", "linux"]
if (!SupportedOS.includes(process.platform)) {
	console.log("Unsupported OS")
	process.exit(1)
}
if(!['x64','x32','arm','arm64'].includes(process.arch)){
	console.error("Arch not support")
	process.exit(1)
}