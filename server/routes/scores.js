import { Router } from "express";
import { saveScore, getLeaderboard } from "../controllers/scoresController.js";

const router = Router();

router.post("/", saveScore);
router.get("/:dificultad/:nivel", getLeaderboard);

export default router;
