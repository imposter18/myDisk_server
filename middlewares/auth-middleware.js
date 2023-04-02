import ApiError from "../exeptions/api-error.js";
import tokenService from "../service/token-service.js";

export default function authMiddleware(req, res, next) {
	try {
		const authorizationHeader = req.headers.authorization;
		// console.log(authorizationHeader, "authorizationHeader");
		if (!authorizationHeader) {
			return next(ApiError.UnautorizadError());
		}

		const accessToken = authorizationHeader.split(" ")[1];
		if (!accessToken) {
			return next(ApiError.UnautorizadError());
		}

		const userData = tokenService.validateAccessToken(accessToken);
		if (!userData) {
			return next(ApiError.UnautorizadError());
		}

		req.user = userData;
		next();
	} catch (e) {
		return next(ApiError.UnautorizadError());
	}
}
