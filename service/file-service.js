import * as fs from "fs";
import path from "path";
import fileModel from "../models/file-model.js";

class FileService {
	createDir(file) {
		const filePath = this.getPath(file);
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

	fileExists(path) {
		try {
			fs.accessSync(path);

			return true;
		} catch (e) {
			return false;
		}
	}
	async getAllParent(file, user) {
		try {
			return new Promise((resolve, reject) => {
				const stack = [];
				async function recursiveFind(file) {
					if (file.parent) {
						const fileWithParent = await fileModel.findOne({
							user: user.id,
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
		} catch (e) {
			throw e;
		}
	}
	async uploadFile(file, parent, user, type, fileName, uploadId) {
		return new Promise((ressolve, reject) => {
			try {
				if (user.usedSpace + file.size > user.diskSpace) {
					return reject({ message: "There no space on disk" });
				}

				let path;
				if (parent) {
					path = `${process.env.FILE_PATH}\\${user._id}\\${parent.path}\\${fileName}`;
				} else {
					path = `${process.env.FILE_PATH}\\${user._id}\\${fileName}`;
				}

				const check = this.fileExists(path);

				if (check) {
					return reject({
						message: "File already exist",
						data: { fileName, uploadId: uploadId },
					});
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
						parent: parent._id,
						user: user._id,
						uploadId: uploadId,
					})
				);
			} catch (e) {
				console.log(e);
				reject();
			}
		});
	}
	deleteFile(file) {
		try {
			const path = this.getPath(file);
			if (file.type === "dir") {
				fs.rmdirSync(path, { recursive: true });
			} else {
				fs.unlinkSync(path);
			}
		} catch (e) {
			throw e;
		}
	}
	async getAllChildren(file, userId) {
		try {
			const children = await fileModel.find({
				user: userId,
				parent: file._id,
			});

			return await new Promise((resolve, reject) => {
				let stack = [];
				async function recursiveFindChildren(tree) {
					if (!tree.length) {
						return stack;
					}
					stack.push(...tree);
					for (let i = 0; i < tree.length; i++) {
						await new Promise((resolve) => {
							const children = fileModel.find({ parent: tree[i]._id });
							resolve(children);
						}).then((resalt) => recursiveFindChildren(resalt));
					}
				}

				recursiveFindChildren(children).then(() => resolve(stack));
			});
		} catch (e) {
			throw e;
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
