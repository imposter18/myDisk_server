export default class UserDto {
	email;
	id;
	isActivated;
	diskSpace;
	usedSpace;
	constructor(model) {
		this.email = model.email;
		this.id = model._id;
		this.isActivated = model.isActivated;
		this.diskSpace = model.diskSpace;
		this.usedSpace = model.usedSpace;
	}
}
