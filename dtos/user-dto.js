export default class UserDto {
	email;
	id;
	isActivated;
	userName;
	diskSpace;
	usedSpace;
	constructor(model) {
		this.email = model.email;
		this.id = model._id;
		this.isActivated = model.isActivated;
		this.userName = model.userName;
		this.diskSpace = model.diskSpace;
		this.usedSpace = model.usedSpace;
	}
}
