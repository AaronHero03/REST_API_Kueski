import express from "express";
import { checkBenefits, simulateTransaction } from "../controllers/commerce.controller.js";

var router = express.Router();

router.get("/benefits", checkBenefits);
router.post("/transactions/simulate", simulateTransaction);

export default router;
