import { Router } from "express";
import userController from "../controllers/user-controller.js";
const router = new Router();

router.post("/registration", userController.registration);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get("/refresh", userController.refresh);
router.get("/users", userController.getUsers);
router.get("/activate/:link", userController.activate);

export default router;
