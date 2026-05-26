import express from "express";
import { trackIntent } from "../controllers/transaction.controller";
var router = express.Router();

router.get("/", trackIntent);
router.get("/:id/confirm", confirmTransaction);

export default router;
