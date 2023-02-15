export default class ApiError extends Error {
	status;
	errors;
	constructor(status, message, errors = []) {
		super(message);
		this.status = status;
		this.errors = errors;
	}
	static UnautorizadError() {
		return new ApiError(401, "Пользоватьель не авторизован");
	}
	static BadRequest(message, errors = []) {
		return new ApiError(400, message, errors);
	}
	static serverError(message, errors = []) {
		return new ApiError(500, message, errors);
	}
}
