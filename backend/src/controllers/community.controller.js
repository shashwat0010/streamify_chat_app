import Community from "../models/Community.js";
import CommunityMember from "../models/CommunityMember.js";
import { getRandomCommunityAvatar, getRandomCommunityBanner } from "../lib/placeholders.js";

// Create a new community
export async function createCommunity(req, res) {
  try {
    const { name, description, type, avatar, banner } = req.body;
    const userId = req.user.id;

    if (!name || !description) {
      return res.status(400).json({ message: "Name and description are required" });
    }

    const cleanName = name.trim().replace(/\s+/g, "-").toLowerCase();
    if (cleanName.length < 3) {
      return res.status(400).json({ message: "Community name must be at least 3 characters" });
    }

    const existingCommunity = await Community.findOne({ name: cleanName });
    if (existingCommunity) {
      return res.status(400).json({ message: "Community name already exists" });
    }

    const community = await Community.create({
      name: cleanName,
      description,
      type: type || "public",
      owner: userId,
      avatar: avatar || getRandomCommunityAvatar(cleanName),
      banner: banner || getRandomCommunityBanner(cleanName),
      membersCount: 1,
    });

    // Automatically make the creator the owner member
    await CommunityMember.create({
      community: community._id,
      user: userId,
      role: "owner",
    });

    res.status(201).json({ success: true, community });
  } catch (error) {
    console.error("Error in createCommunity controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Join a community
export async function joinCommunity(req, res) {
  try {
    const { id: communityId } = req.params;
    const userId = req.user.id;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Check membership
    const existingMember = await CommunityMember.findOne({ community: communityId, user: userId });
    if (existingMember) {
      return res.status(400).json({ message: "You are already a member of this community" });
    }

    await CommunityMember.create({
      community: communityId,
      user: userId,
      role: "member",
    });

    // Increment member count
    community.membersCount += 1;
    await community.save();

    res.status(200).json({ success: true, message: "Joined community successfully", community });
  } catch (error) {
    console.error("Error in joinCommunity controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Leave a community
export async function leaveCommunity(req, res) {
  try {
    const { id: communityId } = req.params;
    const userId = req.user.id;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const membership = await CommunityMember.findOne({ community: communityId, user: userId });
    if (!membership) {
      return res.status(400).json({ message: "You are not a member of this community" });
    }

    if (membership.role === "owner") {
      return res.status(400).json({
        message: "As the owner, you cannot leave the community. Transfer ownership or delete it instead.",
      });
    }

    await CommunityMember.deleteOne({ _id: membership._id });

    // Decrement member count
    community.membersCount = Math.max(1, community.membersCount - 1);
    await community.save();

    res.status(200).json({ success: true, message: "Left community successfully", community });
  } catch (error) {
    console.error("Error in leaveCommunity controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Fetch single community metadata
export async function getCommunity(req, res) {
  try {
    const { nameOrId } = req.params;
    const userId = req.user?.id;

    let query = {};
    if (nameOrId.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: nameOrId };
    } else {
      query = { name: nameOrId.toLowerCase() };
    }

    const community = await Community.findOne(query).populate("owner", "fullName profilePic");
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    let userRole = null;
    if (userId) {
      const membership = await CommunityMember.findOne({ community: community._id, user: userId });
      if (membership) {
        userRole = membership.role;
      }
    }

    res.status(200).json({ success: true, community, userRole });
  } catch (error) {
    console.error("Error in getCommunity controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// List/Explore communities
export async function getCommunities(req, res) {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      };
    }

    const communities = await Community.find(query).sort({ membersCount: -1 }).limit(20);
    res.status(200).json({ success: true, communities });
  } catch (error) {
    console.error("Error in getCommunities controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// List communities that user is a member of
export async function getJoinedCommunities(req, res) {
  try {
    const userId = req.user.id;

    const memberships = await CommunityMember.find({ user: userId })
      .populate("community")
      .sort({ joinedAt: -1 });

    const communities = memberships
      .filter((m) => m.community !== null)
      .map((m) => ({
        ...m.community.toObject(),
        role: m.role,
      }));

    res.status(200).json({ success: true, communities });
  } catch (error) {
    console.error("Error in getJoinedCommunities controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Update role of a member
export async function updateMemberRole(req, res) {
  try {
    const { communityId, targetUserId } = req.params;
    const { role } = req.body; // 'moderator' or 'member'
    const currentUserId = req.user.id;

    if (!["moderator", "member"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Verify current user is owner
    const callerMembership = await CommunityMember.findOne({ community: communityId, user: currentUserId });
    if (!callerMembership || callerMembership.role !== "owner") {
      return res.status(403).json({ message: "Only the community owner can change member roles" });
    }

    const targetMembership = await CommunityMember.findOne({ community: communityId, user: targetUserId });
    if (!targetMembership) {
      return res.status(404).json({ message: "Target user membership not found" });
    }

    targetMembership.role = role;
    await targetMembership.save();

    res.status(200).json({ success: true, message: "Member role updated successfully", membership: targetMembership });
  } catch (error) {
    console.error("Error in updateMemberRole controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateCommunity(req, res) {
  try {
    const { id: communityId } = req.params;
    const { description, type, avatar, banner } = req.body;
    const userId = req.user.id;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Only owner or moderator can update community details
    const membership = await CommunityMember.findOne({ community: communityId, user: userId });
    if (!membership || (membership.role !== "owner" && membership.role !== "moderator")) {
      return res.status(403).json({ message: "You are not authorized to update this community" });
    }

    const updates = {};
    if (description !== undefined) updates.description = description;
    if (type !== undefined) updates.type = type;
    if (avatar !== undefined) updates.avatar = avatar;
    if (banner !== undefined) updates.banner = banner;

    const updatedCommunity = await Community.findByIdAndUpdate(
      communityId,
      { $set: updates },
      { new: true }
    );

    res.status(200).json({ success: true, community: updatedCommunity });
  } catch (error) {
    console.error("Error in updateCommunity controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteCommunity(req, res) {
  try {
    const { id: communityId } = req.params;
    const userId = req.user.id;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Only owner can delete the community
    if (community.owner.toString() !== userId) {
      return res.status(403).json({ message: "Only the owner can delete this community" });
    }

    await Community.findByIdAndDelete(communityId);
    await CommunityMember.deleteMany({ community: communityId });

    res.status(200).json({ success: true, message: "Community deleted successfully" });
  } catch (error) {
    console.error("Error in deleteCommunity controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getCommunityMembers(req, res) {
  try {
    const { communityId } = req.params;
    const members = await CommunityMember.find({ community: communityId })
      .populate("user", "fullName profilePic email")
      .sort({ joinedAt: 1 });

    res.status(200).json({ success: true, members });
  } catch (error) {
    console.error("Error in getCommunityMembers controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function kickCommunityMember(req, res) {
  try {
    const { communityId, targetUserId } = req.params;
    const userId = req.user.id;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const callerMembership = await CommunityMember.findOne({ community: communityId, user: userId });
    if (!callerMembership || (callerMembership.role !== "owner" && callerMembership.role !== "moderator")) {
      return res.status(403).json({ message: "You are not authorized to kick members" });
    }

    const targetMembership = await CommunityMember.findOne({ community: communityId, user: targetUserId });
    if (!targetMembership) {
      return res.status(404).json({ message: "Target user membership not found" });
    }

    if (targetMembership.role === "owner") {
      return res.status(400).json({ message: "Cannot kick the community owner" });
    }

    if (callerMembership.role === "moderator" && targetMembership.role === "moderator") {
      return res.status(403).json({ message: "Moderators cannot kick other moderators" });
    }

    await CommunityMember.deleteOne({ _id: targetMembership._id });

    // Decrement member count
    community.membersCount = Math.max(1, community.membersCount - 1);
    await community.save();

    res.status(200).json({ success: true, message: "Member kicked successfully" });
  } catch (error) {
    console.error("Error in kickCommunityMember controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
