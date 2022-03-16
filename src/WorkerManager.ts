import { File } from "./files"

export class WorkerManager<T = undefined> {
	constructor(
		public workerCount: number,
		public taskList: File[],
		public work: (task: File, args: T) => Promise<void>
	) {}
	async start(args: T) {
		// start workers
		const workers = [] as Promise<void>[]
		for (let i = 0; i < this.workerCount; i++) {
			workers.push(this.worker(this.taskList, args))
		}
		await Promise.all(workers)
	}
	private async worker(taskList: File[], args: T) {
		const safeStop = taskList.length * 2
		var i = 0
		while (i++ < safeStop) {
			const task = taskList.pop()
			if (task === undefined) return
			await this.work(task, args).catch((error) => {
				console.error(error)
			})
		}
	}
}

export default WorkerManager
