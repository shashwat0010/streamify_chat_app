import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { saveMeeting, getMyMeetings, getMeetingById, checkRecording } from "../controllers/meeting.controller.js";

const router = express.Router();

router.post("/", protectRoute, saveMeeting);
router.get("/", protectRoute, getMyMeetings);
router.get("/:id", protectRoute, getMeetingById);
router.post("/:id/check-recording", protectRoute, checkRecording);

export default router;
