export default class UserDto {
	email;
	id;
	isActivated;
	userName;
	constructor(model) {
		this.email = model.email;
		this.id = model._id;
		this.isActivated = model.isActivated;
		this.userName = model.userName;
	}
}
