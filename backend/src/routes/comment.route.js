import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createComment,
  getPostComments,
  castVote,
  toggleBookmark,
  getBookmarkedPosts,
  getUserVotes,
  getUserBookmarksMap,
} from "../controllers/comment.controller.js";

const router = express.Router();

router.post("/", protectRoute, createComment);
router.get("/post/:postId", protectRoute, getPostComments);
router.post("/vote", protectRoute, castVote);
router.post("/bookmark", protectRoute, toggleBookmark);
router.get("/bookmarks", protectRoute, getBookmarkedPosts);
router.get("/user-votes", protectRoute, getUserVotes);
router.get("/user-bookmarks", protectRoute, getUserBookmarksMap);

export default router;
