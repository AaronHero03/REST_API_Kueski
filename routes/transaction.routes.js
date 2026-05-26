import express from "express";
import {
	trackIntent,
	confirmTransaction,
} from "../controllers/transaction.controller.js";
import { simulateTransaction } from "../controllers/commerce.controller.js";

var router = express.Router();

router.post("/simulate", simulateTransaction);
router.post("/", trackIntent);
router.post("/:id/confirm", confirmTransaction);

export default router;
