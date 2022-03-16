import { exec } from "child_process"

const taskList = [] as number[]
const worker = async () => {
	const task = taskList.shift()
	if (task === undefined) return
	console.log(`Task ${task} started`)
	await new Promise<string>((resolve, reject) => {
		exec("start test.bat", (error, stdout, stderr) => {
			if (error) {
				reject(error)
				return
			}
			if (stderr) {
				reject(stderr)
				return
			}
			resolve(stdout)
		})
	})
	await worker()
}

;(async () => {
	console.time("test")

	for (let i = 0; i < 10; i++) {
		taskList.push(i)
	}

	const workers = [] as any[]
	// start 3 workers
	for (let i = 0; i < 3; i++) {
		workers.push(
			worker().catch((error) => {
				console.error(error)
			})
		)
	}
	await Promise.all(workers)
	console.log("All tasks done")
	console.timeEnd("test")
})()
