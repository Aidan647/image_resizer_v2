"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const files_1 = require("../dist/files");
const WorkerManager_1 = require("../dist/WorkerManager");
const assert_1 = __importDefault(require("assert"));
const config_1 = __importDefault(require("../dist/config"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const resizer_1 = require("../dist/resizer");
const utils_1 = __importDefault(require("../dist/utils"));
const sharp_1 = __importDefault(require("sharp"));
describe("Tests", function () {
    describe("utils", () => __awaiter(this, void 0, void 0, function* () {
        it("exists", () => __awaiter(this, void 0, void 0, function* () {
            assert_1.default.strictEqual(yield utils_1.default.exists(__filename), true);
            assert_1.default.strictEqual(yield utils_1.default.exists("./noFile.file"), false);
        }));
        it("folder", () => __awaiter(this, void 0, void 0, function* () {
            assert_1.default.strictEqual(yield utils_1.default.isFolder(__dirname), true);
            assert_1.default.strictEqual(yield utils_1.default.isFolder(__filename), false);
            assert_1.default.strictEqual(yield utils_1.default.isFolder("./noFolder"), false);
            assert_1.default.strictEqual(yield utils_1.default.isFolder("./noFile.file"), false);
        }));
        it("getAbsolutePathForTask", () => __awaiter(this, void 0, void 0, function* () {
            //@ts-ignore
            const set = {
                prefix: "p-",
                suffix: "-s",
                path: __dirname,
                path_out: __dirname,
            };
            assert_1.default.strictEqual(utils_1.default.getAbsolutePathForTask(set, __filename), path_1.default.join(__dirname, "p-test-s.js"));
        }));
    }));
    describe("Config", () => {
        const set = {
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
            path: path_1.default.join(__dirname, "input"),
            path_out: path_1.default.join(__dirname, "output"),
        };
        it("questionConfig", () => __awaiter(this, void 0, void 0, function* () {
            assert_1.default.deepStrictEqual((yield config_1.default.new(set)).get(), set);
        }));
        it("getInstance", () => __awaiter(this, void 0, void 0, function* () {
            assert_1.default.strictEqual(config_1.default.instance, undefined, "Config.instance present before creation");
            assert_1.default.strictEqual(yield config_1.default.getInstance(set), yield config_1.default.getInstance(set), "Config.getInstance not the same");
            assert_1.default.notStrictEqual(config_1.default.instance, undefined, "Config.instance not present after creation");
        }));
        it("new/getInstance", () => __awaiter(this, void 0, void 0, function* () {
            assert_1.default.notStrictEqual(yield config_1.default.getInstance(set), yield config_1.default.new(set));
        }));
    });
    describe("App", () => {
        describe("resizer", () => {
            const Settings = {
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
                path: path_1.default.join(__dirname, "images", "input"),
                path_out: path_1.default.join(__dirname, "images", "output"),
            };
            const images = ["200x1000.png", "1000x200.png", "1000x1000.png"];
            const tests = [
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
            ];
            var dir;
            before(() => __awaiter(this, void 0, void 0, function* () {
                const stat = yield promises_1.default.stat(Settings.path);
                dir = yield new files_1.Directory(Settings.path, stat).read(true);
                // clear output folder before test
                yield promises_1.default.rm(Settings.path_out, { recursive: true });
            }));
            tests.forEach((test) => {
                it(test[0], () => __awaiter(this, void 0, void 0, function* () {
                    const set = Object.assign(Object.assign({}, Settings), { prefix: test[0], resizeMode: test[0] });
                    yield new WorkerManager_1.WorkerManager(set.core, Object.values(dir.getFiles(true)), resizer_1.resizer).start({
                        Settings: set,
                    });
                    for (const index in images) {
                        const image = images[index];
                        const file = path_1.default.join(__dirname, "images", "output", test[0] + image);
                        const metadata = yield (0, sharp_1.default)(file).metadata();
                        assert_1.default.deepStrictEqual({ w: metadata.width, h: metadata.height }, test[1][index], "image " + image + " is not resized correctly");
                    }
                }));
            });
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
        });
    });
});
//{"core":20,"action":3,"lossy":false,"optimization":9,"width":100,"height":200,"resizeMode":"contain","color":"FFF0","overwrite":true,"quality":90,"compression":9,"prefix":"p-","suffix":"-s","path":"graphics","path_out":"d2"}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSx5Q0FBeUM7QUFFekMseURBQXFEO0FBQ3JELG9EQUEyQjtBQUMzQiw0REFBbUM7QUFDbkMsMkRBQTRCO0FBQzVCLGdEQUF1QjtBQUN2Qiw2Q0FBK0M7QUFDL0MsMERBQWlDO0FBQ2pDLGtEQUF5QjtBQUV6QixRQUFRLENBQUMsT0FBTyxFQUFFO0lBQ2pCLFFBQVEsQ0FBQyxPQUFPLEVBQUUsR0FBUyxFQUFFO1FBQzVCLEVBQUUsQ0FBQyxRQUFRLEVBQUUsR0FBUyxFQUFFO1lBQ3ZCLGdCQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sZUFBSyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTtZQUN4RCxnQkFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLGVBQUssQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDL0QsQ0FBQyxDQUFBLENBQUMsQ0FBQTtRQUNGLEVBQUUsQ0FBQyxRQUFRLEVBQUUsR0FBUyxFQUFFO1lBQ3ZCLGdCQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sZUFBSyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTtZQUN6RCxnQkFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLGVBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUE7WUFDM0QsZ0JBQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxlQUFLLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1lBQzdELGdCQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sZUFBSyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNqRSxDQUFDLENBQUEsQ0FBQyxDQUFBO1FB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