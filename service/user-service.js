import userModel from "../models/user-model.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import MailService from "./mail-service.js";
import tokenService from "./token-service.js";
import UserDto from "../dtos/user-dto.js";
import ApiError from "../exeptions/api-error.js";
class UserService {
	async registration(email, password, userName) {
		const candidate = await userModel.findOne({ email });
		if (candidate) {
			throw ApiError.BadRequest(
				`Пользователь с таким почтовым адресом ${email} уже существует`
			);
		}
		const hashPassword = await bcrypt.hash(password, 3);
		const activationLink = uuidv4();
		const user = new userModel({
			userName,
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
		// return res.json({ message: `User was created` });
		return {
			...tokens,
			user: userDto,
		};
	}
	async activate(activationLink) {
		const user = await userModel.findOne({ activationLink });
		if (!user) {
			throw ApiError.BadRequest("Неккоректная ссылка активации");
		}
		user.isActivated = true;
		await user.save();
	}
	async login(email, password) {
		const user = await userModel.findOne({ email });
		if (!user) {
			throw ApiError.BadRequest("Пользователь с таким email не найден");
		}
		const isPassEquals = await bcrypt.compare(password, user.password);
		if (!isPassEquals) {
			throw ApiError.BadRequest("Неверный пароль");
		}
		const userDto = new UserDto(user);
		const tokens = tokenService.generateTokens({ ...userDto });
		await tokenService.saveToken(userDto.id, tokens.refreshToken);
		return {
			...tokens,
			user: userDto,
		};
	}
	async logout(refreshToken) {
		const token = await tokenService.removeToken(refreshToken);
		return token;
	}
	async refresh(refreshToken) {
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
	}
	async getAllUsers() {
		const users = await userModel.find();
		return users;
	}
}

export default new UserService();