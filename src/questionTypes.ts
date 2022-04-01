type zeroToNine = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export interface resizeGlobal {
	core: number
	width: number
	height: number
	overwrite: boolean
	formatForce: null | "jpg" | "png" | "webp"
	quality: number
	compression: zeroToNine
	prefix: string
	suffix: string
	path: string
	path_out: string
}
export interface optimizeGlobal {
	core: number
	optimization: zeroToNine
	lossy: boolean
	overwrite: boolean
	prefix: string
	suffix: string
	path: string
	path_out: string
}
export interface optimize extends optimizeGlobal {
	action: 2
}

export interface resizeOptimize extends resizeGlobal, optimizeGlobal {
	action: 3
	resizeMode: "cover" | "fill" | "inside" | "outside" | undefined
}
export interface resizeOptimizeColor extends resizeGlobal, optimizeGlobal {
	action: 3
	resizeMode: "contain"
	color: string
}
export interface resize extends resizeGlobal {
	action: 1
	resizeMode: "cover" | "fill" | "inside" | "outside" | undefined
}
export interface resizeColor extends resizeGlobal {
	action: 1
	resizeMode: "contain"
	color: string
}
export type questionConfig = resize | resizeOptimize | optimize | resizeColor | resizeOptimizeColor
export default questionConfig
