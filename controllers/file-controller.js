import fileService from "../service/file-service.js";
import userModel from "../models/user-model.js";
import fileModel from "../models/file-model.js";
import * as fs from "fs";
import path from "path";
import ApiError from "../exeptions/api-error.js";
import { Buffer } from "node:buffer";

class FileController {
	async createDir(req, res, next) {
		try {
			const { name, type, parent } = req.body;
			const file = new fileModel({ name, type, parent, user: req.user.id });
			const parentFile = await fileModel.findOne({ _id: parent });
			if (!parentFile) {
				file.path = name;
				await fileService.createDir(file);
			} else {
				file.path = `${parentFile.path}\\${file.name}`;
				await fileService.createDir(file);
				parentFile.childs.push(file._id);
				await parentFile.save();
			}
			await file.save();
			return res.json(file);
		} catch (e) {
			console.log(e);
			// next(e);
			return res.status(400).json(e.message);
		}
	}
	async getFiles(req, res) {
		try {
			const files = await fileModel.find({
				user: req.user.id,
				parent: req.query.parent,
			});
			return res.json(files);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: "Can not get file" });
		}
	}
	async getAllParent(req, res) {
		try {
			console.log(req.query, "req.query");
			const file = await fileModel.findOne({
				user: req.user.id,
				_id: req.query.id,
			});

			let promise = () =>
				new Promise((resolve, reject) => {
					const stack = [];
					async function recursiveFind(file) {
						if (file.parent) {
							const fileWithParent = await fileModel.findOne({
								user: req.user.id,
								_id: file.parent,
							});
							stack.push(fileWithParent);
							return recursiveFind(fileWithParent);
						} else {
							resolve(stack);
						}
					}
					recursiveFind(file);
				});
			const startPromise = async () => {
				const result = await promise();
				if (result) {
					console.log(result, "done");
					return res.json(result);
				}
			};

			startPromise();
			// promise.then((res) => console.log(res, "ress"));
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: "Can not get file" });
		}
	}
	async uploadFile(req, res) {
		try {
			// console.log(req);
			const file = req.files.file;
			// const someEncodedString = Buffer.from(file.name, "utf-8").toString();
			// console.log(someEncodedString, "someEncodedString");

			const parent = await fileModel.findOne({
				user: req.user.id,
				_id: req.body.parent,
			});
			const user = await userModel.findOne({ _id: req.user.id });

			const dbFile = await fileService.uploadFile(file, parent, user);
			await dbFile.save();

			res.json(dbFile);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: "Upload error" });
		}
	}
	async downloadFile(req, res, next) {
		try {
			const file = await fileModel.findOne({
				_id: req.query.id,
				user: req.user.id,
			});

			const puth = `${process.env.FILE_PATH}\\${req.user.id}\\${file.path}`;

			function fileExists(path) {
				try {
					fs.accessSync(path);

					return true;
				} catch (e) {
					return false;
				}
			}

			if (fileExists(puth)) {
				// console.log(file);
				return res.download(puth, file.name, { dotfiles: "allow" });
			}
			return next(ApiError.BadRequest("Download error", errors.array()));
		} catch (e) {
			console.log(e);
			// next(ApiError.BadRequest("Download error1", e));
			res.status(500).json({ message: "Download error" });
		}
	}
	async deleteFile(req, res) {
		try {
			const file = await fileModel.findOne({
				_id: req.query.id,
				user: req.user.id,
			});
			if (!file) {
				return res.status(400).json({ message: "File not found" });
			}
			fileService.deleteFile(file);
			await file.remove();
			return res.json(file);
		} catch (e) {
			console.log(e);
			return res.status(400).json({ message: "Dir is not empty" });
		}
	}
}

export default new FileController();
