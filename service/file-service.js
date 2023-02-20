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
	async uploadFile(file, parent, user) {
		try {
			if (user.usedSpace + file.size > user.diskSpace) {
				return res.status(400).json({ message: "There no space on disk" });
			}

			let path;
			if (parent) {
				path = `${process.env.FILE_PATH}\\${user._id}\\${parent.path}\\${file.name}`;
			} else {
				path = `${process.env.FILE_PATH}\\${user._id}\\${file.name}`;
			}
			if (fs.existsSync(path)) {
				return res.status(400).json({ message: "File already exist" });
			}
			user.usedSpace = user.usedSpace + file.size;
			await user.save();
			file.mv(path);
			const type = file.name.split(".").pop();
			let filePath = file.name;
			if (parent) {
				filePath = parent.path + "\\" + file.name;
			}

			return new fileModel({
				name: file.name,
				type,
				size: file.size,
				path: filePath,
				parent: parent?._id,
				user: user._id,
			});
		} catch (e) {
			throw ApiError.BadRequest("Download error", errors.array());
		}
	}
	deleteFile(file) {
		const path = this.getPath(file);
		if (file.type === "dir") {
			fs.rmdirSync(path);
		} else {
			fs.unlinkSync(path);
		}
	}
	getPath(file) {
		return `${process.env.FILE_PATH}\\${file.user}\\${file.path}`;
	}
}

export default new FileService();
