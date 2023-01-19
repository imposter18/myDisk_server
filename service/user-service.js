import userModel from "../models/user-model.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import MailService from "./mail-service.js";
import tokenService from "./token-service.js";
import UserDto from "../dtos/user-dto.js";
class UserService {
	async registration(email, password, userName) {
		const candidate = await userModel.findOne({ email });
		if (candidate) {
			throw new Error(
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
			throw new Error("Неккоректная ссылка активации");
		}
		user.isActivated = true;
		await user.save();
	}
}

export default new UserService();
