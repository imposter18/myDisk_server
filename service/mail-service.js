import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
dotenv.config();

class MailService {
	constructor() {
		this.transporter = nodemailer.createTransport({
			// host: process.env.SMTP_HOST,
			// port: process.env.SMTP_PORT,
			// secure: false,
			service: "gmail",
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASSWORD,
			},
		});
		// this.transporter.verify(function (error, success) {
		// 	if (error) {
		// 		console.log(error);
		// 	} else {
		// 		console.log("Server is ready to take our messages");
		// 	}
		// });
	}
	async sendActivationMail(to, link) {
		await this.transporter.sendMail({
			from: process.env.SMTP_USER,
			to,
			subject: "Активация аккаунта на " + process.env.API_URL,
			text: "",
			html: `
				<div>
					<h1>Для активации перейдите по ссылке</h1>
					<a href="${link}">${link}</a>
				</div>
				`,
		});
	}
}
export default new MailService();
