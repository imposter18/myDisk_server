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
			const currentDir = await fileModel.findOne({
				user: req.user.id,
				_id: req.query.parent,
			});
			return res.json({ files, currentDir });
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: "Can not get file" });
		}
	}
	async getAllParent(req, res) {
		try {
			const file = await fileModel.findOne({
				user: req.user.id,
				_id: req.query.id,
			});
			const promise = () =>
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
					return res.json(result);
				}
			};

			startPromise();
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: "Can not get parent" });
		}
	}
	async uploadFile(req, res) {
		try {
			const file = req.files.file;
			const fileName = req.body.fileName;
			const uploadId = req.body.uploadId;
			//
			// const filePath = `${process.env.FILE_PATH}\\${file.user}\\${file.path}`;
			// return new Promise((ressolve, reject) => {
			// 	try {
			// 		if (!fs.existsSync(filePath)) {
			// 			fs.mkdirSync(filePath, { recursive: true });
			// 			return ressolve({ message: "File was created!" });
			// 		} else {
			// 			return reject({
			// 				message: `File named "${file.name}" already exists!`,
			// 			});
			// 		}
			// 	} catch (e) {
			// 		return reject({ message: "File error" });
			// 	}
			// });

			//
			const parent = await fileModel.findOne({
				user: req.user.id,
				_id: req.body.parent,
			});
			const user = await userModel.findOne({ _id: req.user.id });

			const dbFile = await fileService.uploadFile(
				file,
				parent,
				user,
				res,
				fileName,
				uploadId
			);
			// console.log(dbFile, "dbFile");
			if (dbFile) {
				await dbFile.save();
			}
			console.log(dbFile);
			res.json(dbFile);
		} catch (e) {
			return res.status(500).json({ message: e });
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
			const children = await fileService.getAllChildren(file, req.user.id);
			// console.log(children, "children");
			children.forEach(async (element) => {
				await element.remove();
			});
			fileService.deleteFile(file);

			return res.json(file);
		} catch (e) {
			console.log(e);
			return res.status(400).json({ message: "Dir is not empty" });
		}
	}
}

export default new FileController();
