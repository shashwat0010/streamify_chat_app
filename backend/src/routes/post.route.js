import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createPost,
  getUploadUrl,
  handleLocalUpload,
  getCommunityPosts,
  getPostDetails,
  deletePost,
  getFeedPosts,
} from "../controllers/post.controller.js";

const router = express.Router();

router.get("/", protectRoute, getFeedPosts);
router.post("/", protectRoute, createPost);
router.get("/upload-url", protectRoute, getUploadUrl);
router.put("/local-upload-fallback", handleLocalUpload);
router.get("/c/:nameOrId", protectRoute, getCommunityPosts);
router.get("/:id", protectRoute, getPostDetails);
router.delete("/:id", protectRoute, deletePost);

export default router;
