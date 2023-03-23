import * as fs from "fs";
import path from "path";
import ApiError from "../exeptions/api-error.js";

import fileModel from "../models/file-model.js";

class FileService {
	createDir(file) {
		const filePath = `${process.env.FILE_PATH}\\${file.user}\\${file.path}`;
		return new Promise((ressolve, reject) => {
			try {
				if (!fs.existsSync(filePath)) {
					fs.mkdirSync(filePath, { recursive: true });
					return ressolve({ message: "File was created!" });
				} else {
					return reject({
						message: `File named "${file.name}" already exists!`,
					});
				}
			} catch (e) {
				return reject({ message: "File error" });
			}
		});
	}
	// !!
	fileExists(path) {
		try {
			fs.accessSync(path);

			return true;
		} catch (e) {
			return false;
		}
	}
	async uploadFile(file, parent, user, type, fileName, uploadId) {
		return new Promise((ressolve, reject) => {
			try {
				if (user.usedSpace + file.size > user.diskSpace) {
					// return res.status(400).json({ message: "There no space on disk" });
					return reject({ message: "There no space on disk" });
				}

				let path;
				if (parent) {
					path = `${process.env.FILE_PATH}\\${user._id}\\${parent.path}\\${fileName}`;
				} else {
					path = `${process.env.FILE_PATH}\\${user._id}\\${fileName}`;
				}
				function fileExists(path) {
					try {
						fs.accessSync(path);

						return true;
					} catch (e) {
						return false;
					}
				}

				const check = fileExists(path);

				if (check) {
					return reject({
						message: "File already exist",
						data: { fileName, uploadId: uploadId },
					});
					// return res
					// 	.status(400)
					// 	.json({ message: "File already exist", data: file.name });
				}

				user.usedSpace = user.usedSpace + file.size;
				user.save();
				file.mv(path);

				let filePath = fileName;
				if (parent) {
					filePath = parent.path + "\\" + fileName;
				}

				return ressolve(
					new fileModel({
						name: fileName,
						type,
						size: file.size,
						path: filePath,
						date: new Date(),
						parent: parent?._id,
						user: user._id,
						uploadId: uploadId,
					})
				);
			} catch (e) {
				console.log(e);
				throw ApiError.BadRequest("Download error");
			}
		});
	}
	deleteFile(file) {
		const path = this.getPath(file);
		if (file.type === "dir") {
			fs.rmdirSync(path, { recursive: true });
		} else {
			fs.unlinkSync(path);
		}
	}
	async getAllChildren(file, userId) {
		try {
			const promise = (fileTree) =>
				new Promise((resolve, reject) => {
					let stack = [];
					async function recursivFindChildren(tree) {
						stack.push(...tree);
						for (let i = 0; i < tree.length; i++) {
							const childTree = await fileModel.find({
								user: userId,
								parent: tree[i]._id,
							});
							return recursivFindChildren(childTree);
						}
					}

					recursivFindChildren(fileTree).then(() => resolve(stack));
				});

			const startPromise = async () => {
				const treeChild = await fileModel.find({
					user: userId,
					parent: file._id,
				});
				const result = await promise(treeChild);
				if (result) {
					return result;
				}
			};

			return startPromise();
		} catch (e) {
			return e;
		}
	}
	getPath(file) {
		return `${process.env.FILE_PATH}\\${file.user}\\${file.path}`;
	}
	getPathToMainDirectory(file) {
		return `${process.env.FILE_PATH}\\${file.user}\\`;
	}
	getRelativePathToFile(file) {
		if (file.path === file.name) {
			return "";
		}

		if (file.path !== file.name) {
			return `${path.dirname(file.path)}\\`;
		}
	}
}

export default new FileService();
