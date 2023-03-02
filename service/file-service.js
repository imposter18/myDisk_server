import * as fs from "fs";

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
	async uploadFile(file, parent, user, res) {
		return new Promise((ressolve, reject) => {
			try {
				if (user.usedSpace + file.size > user.diskSpace) {
					// return res.status(400).json({ message: "There no space on disk" });
					return reject({ message: "There no space on disk" });
				}

				let path;
				if (parent) {
					path = `${process.env.FILE_PATH}\\${user._id}\\${parent.path}\\${file.name}`;
				} else {
					path = `${process.env.FILE_PATH}\\${user._id}\\${file.name}`;
				}

				function fileExists(path) {
					try {
						fs.accessSync(path);

						return true;
					} catch (e) {
						return false;
					}
				}

				const f = fileExists(path);

				if (f) {
					return reject({ message: "File already exist", data: file.name });
					// return res
					// 	.status(400)
					// 	.json({ message: "File already exist", data: file.name });
				}

				user.usedSpace = user.usedSpace + file.size;
				user.save();
				file.mv(path);
				const type = file.name.split(".").pop();
				let filePath = file.name;
				if (parent) {
					filePath = parent.path + "\\" + file.name;
				}

				return ressolve(
					new fileModel({
						name: file.name,
						type,
						size: file.size,
						path: filePath,
						parent: parent?._id,
						user: user._id,
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
			fs.rmdirSync(path);
		} else {
			fs.unlinkSync(path);
		}
	}
	async recursiveDeleteFiles(file, userId) {
		const path = this.getPath(file);

		// async function b() {
		//

		// 	return stack;
		// }
		// const c = b(file).then((res) => {
		// 	console.log(res, "res");
		// });
		const treeChild = await fileModel.find({
			user: userId,
			parent: file._id,
		});
		const promise = () =>
			new Promise((resolve, reject) => {
				let stack = [];
				async function recursivDelete(tree) {
					stack.push(...tree);

					// console.log(tree, "tree");
					// if (!tree.length) {
					// 	console.log("Privet andrey");
					// 	return;
					// }
					for (let i = 0; i < tree.length; i++) {
						// stack.push(child);
						// console.log(child, "child");
						const childTree = await fileModel.find({
							user: userId,
							parent: tree[i]._id,
						});
						// console.log(childTree, "childTree");

						return recursivDelete(childTree);
					}
				}
				recursivDelete(treeChild)
					.then()
					.then((res) => resolve(stack));
			});

		const startPromise = async () => {
			const result = await promise();
			if (result) {
				console.log(result, "result");
			}
		};
		startPromise();
		return;
	}
	getPath(file) {
		return `${process.env.FILE_PATH}\\${file.user}\\${file.path}`;
	}
}

export default new FileService();
