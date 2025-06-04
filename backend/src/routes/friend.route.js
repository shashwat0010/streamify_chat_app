import express from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  getFriendRequests,
  getFriends,
  removeFriend,
} from "../controllers/friend.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes are protected
router.use(protectRoute);

// Send friend request
router.post("/request", sendFriendRequest);

// Accept friend request
router.put("/request/:requestId/accept", acceptFriendRequest);

// Get friend requests
router.get("/requests", getFriendRequests);

// Get friends list
router.get("/", getFriends);

// Remove friend
router.delete("/:friendId", removeFriend);

export default router; 