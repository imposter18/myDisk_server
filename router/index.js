import { Router } from "express";
import userController from "../controllers/user-controller.js";
import { body } from "express-validator";
import authMiddleware from "../middlewares/auth-middleware.js";
import fileController from "../controllers/file-controller.js";

const router = new Router();

router.post(
	"/registration",
	body("email").isEmail(),
	body("password").isLength({ min: 4, max: 32 }),
	userController.registration
);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get("/refresh", userController.refresh);
router.get("/userSpace", authMiddleware, userController.getUserSpace);
router.get("/activate/:link", userController.activate);
router.get("/updateUserSpace", authMiddleware, userController.getUserSpace);
//
router.post("/files", authMiddleware, fileController.createDir);
router.get("/files", authMiddleware, fileController.getFiles);
router.post("/upload", authMiddleware, fileController.uploadFile);
router.get("/download", authMiddleware, fileController.downloadFile);
router.delete("/files", authMiddleware, fileController.deleteFile);
router.get("/getPerent", authMiddleware, fileController.getAllParent);

export default router;
