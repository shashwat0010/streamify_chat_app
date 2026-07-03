import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../lib/upload.js";
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
// Accept optional single file "media" via multipart form-data
router.post("/", protectRoute, upload.single("media"), createPost);
router.get("/upload-url", protectRoute, getUploadUrl);
// Local upload fallback also uses multer now
router.post("/local-upload-fallback", upload.single("file"), handleLocalUpload);
router.get("/c/:nameOrId", protectRoute, getCommunityPosts);
router.get("/:id", protectRoute, getPostDetails);
router.delete("/:id", protectRoute, deletePost);

export default router;
