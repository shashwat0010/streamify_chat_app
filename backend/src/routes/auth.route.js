import express from "express";
import { getMe, onboard } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/onboarding", protectRoute, onboard);
router.get("/me", protectRoute, getMe);

export default router;
