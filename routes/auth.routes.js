import express from "express";
import { login } from "../controllers/auth.controller.js";

var router = express.Router();

router.post("/login", login);

export default router;
