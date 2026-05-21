import express from "express";
import { login, verifyToken } from "../controllers/auth.controller.js";

var router = express.Router();

router.post("/login", login);
router.get("/verify", verifyToken);

export default router;
