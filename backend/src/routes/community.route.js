import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunity,
  getCommunities,
  getJoinedCommunities,
  updateMemberRole,
  updateCommunity,
  deleteCommunity,
  getCommunityMembers,
  kickCommunityMember,
} from "../controllers/community.controller.js";

const router = express.Router();

router.post("/", protectRoute, createCommunity);
router.get("/", protectRoute, getCommunities);
router.get("/joined", protectRoute, getJoinedCommunities);
router.get("/:nameOrId", protectRoute, getCommunity);
router.put("/:id", protectRoute, updateCommunity);
router.delete("/:id", protectRoute, deleteCommunity);
router.post("/:id/join", protectRoute, joinCommunity);
router.post("/:id/leave", protectRoute, leaveCommunity);
router.get("/:communityId/members", protectRoute, getCommunityMembers);
router.put("/:communityId/members/:targetUserId/role", protectRoute, updateMemberRole);
router.delete("/:communityId/members/:targetUserId", protectRoute, kickCommunityMember);

export default router;
