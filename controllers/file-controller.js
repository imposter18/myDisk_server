import fileService from "../service/file-service.js";
import userModel from "../models/user-model.js";
import fileModel from "../models/file-model.js";
import * as fs from "fs";
import path from "path";
import { pathToServer } from "../default.js";

class FileController {
	async createDir(req, res, next) {
		try {
			const { name, type, parent } = req.body;
			const file = new fileModel({
				name,
				type,
				parent,
				user: req.user.id,
				date: new Date(),
			});

			const parentFile = await fileModel.findOne({ _id: parent });
			if (!parentFile) {
				file.path = name;
				await fileService.createDir(file);
			} else {
				file.path = path.normalize(`${parentFile.path}//${file.name}`);
				await fileService.createDir(file);
				parentFile.childs.push(file._id);
				await parentFile.save();
			}
			await file.save();
			return res.json(file);
		} catch (e) {
			console.log(e);
			return res.status(400).json({ message: e.message, error: e });
		}
	}
	async getFiles(req, res) {
		try {
			const { sort } = req.query;
			const { derection } = req.query;
			const { search } = req.query;
			let files;
			if (search) {
				files = await fileModel.find({ user: req.user.id });
				files = files.filter((file) =>
					file.name.toLowerCase().includes(search.toLowerCase())
				);
				return res.json({ files, currentDir: null });
			}

			const derectionIndex = derection === "asc" ? 1 : -1;

			switch (sort) {
				case "name":
					files = await fileModel
						.find({
							user: req.user.id,
							parent: req.query.parent,
						})
						.sort({ name: derectionIndex });
					break;
				case "type":
					files = await fileModel
						.find({
							user: req.user.id,
							parent: req.query.parent,
						})
						.sort({ type: derectionIndex });
					break;
				case "date":
					files = await fileModel
						.find({
							user: req.user.id,
							parent: req.query.parent,
						})
						.sort({ date: derectionIndex });
					break;
				case "size":
					files = await fileModel
						.find({
							user: req.user.id,
							parent: req.query.parent,
						})
						.sort({ size: derectionIndex });
					break;

				default:
					files = await fileModel.find({
						user: req.user.id,
						parent: req.query.parent,
					});
					break;
			}

			const currentDir = await fileModel.findOne({
				user: req.user.id,
				_id: req.query.parent,
			});
			return res.json({ files, currentDir });
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: "Can not get file", error: e });
		}
	}
	async getAllParent(req, res) {
		try {
			const user = req.user;
			const file = await fileModel.findOne({
				user: user.id,
				_id: req.query.id,
			});

			let parents = await fileService.getAllParent(file, user);
			parents = parents.reverse();

			return res.json(parents);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: "Can not get parent", error: e });
		}
	}
	async uploadFile(req, res) {
		try {
			const file = req.files.file;
			const fileName = req.body.fileName;
			const uploadId = req.body.uploadId;
			const type = file.name.split(".").pop();
			const parent = await fileModel.findOne({
				user: req.user.id,
				_id: req.body.parent,
			});
			const user = await userModel.findOne({ _id: req.user.id });

			const dbFile = await fileService.uploadFile(
				file,
				parent,
				user,
				type,
				fileName,
				uploadId
			);
			if (dbFile) {
				await dbFile.save();
			}
			res.json(dbFile);
		} catch (e) {
			console.log(e);
			return res
				.status(500)
				.json({ message: e.message, error: e, data: e.data });
		}
	}
	async downloadFile(req, res, next) {
		try {
			const file = await fileModel.findOne({
				_id: req.query.id,
				user: req.user.id,
			});
			const puth = path.normalize(
				`${pathToServer}//files//${req.user.id}//${file.path}`
			);

			if (fileService.fileExists(puth)) {
				return res.download(puth, file.name, { dotfiles: "allow" });
			}
			return res.status(500).json({ message: "Download error" });
		} catch (e) {
			console.log(e);
			res.status(500).json({ message: "Download error", error: e });
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
			children.forEach(async (element) => {
				await element.remove();
			});
			file.remove();
			fileService.deleteFile(file);

			return res.json(file);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: "delete error", error: e });
		}
	}
	async searchFile(req, res) {
		try {
			const searchName = req.query.search;
			let files = await fileModel.find({ user: req.user.id });
			files = files.filter((file) => file.name.includes(searchName));
			return res.json(files);
		} catch (e) {
			console.log(e);
			return res.status(400).json({ message: "Search error", error: e });
		}
	}
	async renameFile(req, res) {
		try {
			const fileId = req.body.id;
			const newName = req.body.newName;
			const user = req.user;

			const file = await fileModel.findOne({ user: user.id, _id: fileId });

			const oldAbsolutPath = fileService.getPath(file);
			const checkAccess = fileService.fileExists(oldAbsolutPath);

			if (checkAccess) {
				const relativePathToFile = fileService.getRelativePathToFile(file);
				const newRelativePath = path.normalize(
					`${relativePathToFile}${newName}`
				);
				let newAbsolutPath = path.normalize(
					fileService.getPathToMainDirectory(file) + newRelativePath
				);
				const checkAccessNewPath = fileService.fileExists(newAbsolutPath);
				if (!checkAccessNewPath) {
					fs.renameSync(oldAbsolutPath, newAbsolutPath);
					if (file.type === "dir") {
						const children = await fileService.getAllChildren(file, user.id);
						children.map((child) => {
							return (child.path = child.path.replace(
								file.path,
								newRelativePath
							));
						});
						children.forEach((child) => {
							child.save();
						});
					}
					file.name = newName;
					file.path = newRelativePath;
					file.save();
				} else {
					return res
						.status(400)
						.json({ message: `File named "${newName}" already exists!` });
				}
			} else {
				return res.status(500).json({ message: "Access error" });
			}

			return res.json(file);
		} catch (e) {
			console.log(e);
			return res.status(500).json({ message: "Rename error", error: e });
		}
	}
}

export default new FileController();
