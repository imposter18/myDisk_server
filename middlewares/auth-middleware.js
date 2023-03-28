import ApiError from "../exeptions/api-error.js";
import tokenService from "../service/token-service.js";

export default function authMiddleware(req, res, next) {
	try {
		const authorizationHeader = req.headers.authorization;
		if (!authorizationHeader) {
			return next(ApiError.UnautorizadError());
		}

		const accessToken = authorizationHeader.split(" ")[1];
		if (!accessToken) {
			return next(ApiError.UnautorizadError());
		}

		const userData = tokenService.validateAccessToken(accessToken);
		// console.log(userData, "userData");
		if (!userData) {
			return next(ApiError.UnautorizadError());
		}

		req.user = userData;
		next();
	} catch (e) {
		return next(ApiError.UnautorizadError());
	}
}
