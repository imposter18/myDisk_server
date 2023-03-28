import userModel from "../models/user-model.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import MailService from "./mail-service.js";
import tokenService from "./token-service.js";
import UserDto from "../dtos/user-dto.js";
import ApiError from "../exeptions/api-error.js";
import fileService from "./file-service.js";
import fileModel from "../models/file-model.js";
class UserService {
	async registration(email, password) {
		try {
			const candidate = await userModel.findOne({ email });
			if (candidate) {
				throw ApiError.BadRequest(
					`A user with this email address «${email}» already exists`
				);
			}
			const hashPassword = await bcrypt.hash(password, 3);
			const activationLink = uuidv4();
			const user = new userModel({
				email,
				password: hashPassword,
				activationLink,
			});
			await MailService.sendActivationMail(
				email,
				`${process.env.API_URL}/api/activate/${activationLink}`
			);
			const userDto = new UserDto(user);
			const tokens = tokenService.generateTokens({ ...userDto });
			await tokenService.saveToken(userDto.id, tokens.refreshToken);
			await user.save();
			await fileService.createDir(new fileModel({ user: user.id, name: "" }));
			return {
				...tokens,
				user: userDto,
			};
		} catch (e) {
			throw e;
		}
	}
	async activate(activationLink) {
		try {
			const user = await userModel.findOne({ activationLink });
			if (!user) {
				throw ApiError.BadRequest("Неккоректная ссылка активации");
			}
			user.isActivated = true;
			await user.save();
		} catch (e) {
			throw e;
		}
	}
	async login(email, password) {
		try {
			const user = await userModel.findOne({ email });
			if (!user) {
				throw ApiError.BadRequest(`Wrong login or password`);
			}
			const isPassEquals = await bcrypt.compare(password, user.password);
			if (!isPassEquals) {
				throw ApiError.BadRequest("Wrong login or password");
			}
			const userDto = new UserDto(user);
			const tokens = tokenService.generateTokens({ ...userDto });
			await tokenService.saveToken(userDto.id, tokens.refreshToken);
			return {
				...tokens,
				user: userDto,
			};
		} catch (e) {
			throw e;
		}
	}
	async logout(refreshToken) {
		try {
			const token = await tokenService.removeToken(refreshToken);
			return token;
		} catch (e) {
			throw e;
		}
	}
	async refresh(refreshToken) {
		try {
			if (!refreshToken) {
				throw ApiError.UnautorizadError();
			}
			const userData = tokenService.validateRefreshToken(refreshToken);
			const tokenFromDb = await tokenService.findToken(refreshToken);
			if (!userData || !tokenFromDb) {
				throw ApiError.UnautorizadError();
			}
			const user = await userModel.findById(userData.id);
			const userDto = new UserDto(user);
			const tokens = tokenService.generateTokens({ ...userDto });
			await tokenService.saveToken(userDto.id, tokens.refreshToken);
			return {
				...tokens,
				user: userDto,
			};
		} catch (e) {
			throw e;
		}
	}

	async getAllUsers() {
		try {
			const users = await userModel.find();
			return users;
		} catch (e) {
			throw e;
		}
	}
}

export default new UserService();
