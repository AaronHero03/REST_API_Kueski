import express from "express";
import { checkBenefits } from "../controllers/commerce.controller.js";

var router = express.Router();

router.get("/benefits", checkBenefits);

export default router;
