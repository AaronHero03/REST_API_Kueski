import express from "express";
import { getUserDashboard, getUserLoans } from "../controllers/user.controller.js";

var router = express.Router();

router.get("/me/dashboard", getUserDashboard);
router.get("/loans", getUserLoans);

export default router;
