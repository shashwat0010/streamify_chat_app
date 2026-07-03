import Post from "../models/Post.js";
import Community from "../models/Community.js";
import CommunityMember from "../models/CommunityMember.js";
import { generateUploadUrl } from "../lib/s3.js";
import redis from "../lib/redis.js";
import path from "path";

// Generate S3 Upload Pre-signed URL or Local Fallback upload link
export async function getUploadUrl(req, res) {
  try {
    const { fileName, fileType } = req.query;
    if (!fileName || !fileType) {
      return res.status(400).json({ message: "fileName and fileType are required" });
    }

    const uploadDetails = await generateUploadUrl(fileName, fileType);
    res.status(200).json({ success: true, ...uploadDetails });
  } catch (error) {
    console.error("Error in getUploadUrl:", error);
    res.status(500).json({ message: "Failed to generate upload URL" });
  }
}

// Local File Upload Fallback Endpoint (handled via multer - see post.route.js)
// This is now a no-op placeholder; actual upload is handled by multer middleware
export async function handleLocalUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file received" });
    }
    const serverUrl = process.env.NODE_ENV === "production" ? "" : `http://localhost:${process.env.PORT || 5001}`;
    const fileUrl = `${serverUrl}/uploads/${req.file.filename}`;
    res.status(200).json({ success: true, fileUrl });
  } catch (error) {
    console.error("Error in handleLocalUpload:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Create a new post in a community
export async function createPost(req, res) {
  try {
    const { title, content, communityId } = req.body;
    const userId = req.user.id;

    if (!title || !communityId) {
      return res.status(400).json({ message: "Title and communityId are required" });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Verify user is a member of the community (if it is private or just to ensure post authorization)
    const membership = await CommunityMember.findOne({ community: communityId, user: userId });
    if (!membership && community.type === "private") {
      return res.status(403).json({ message: "You must join this private community to post" });
    }

    // Handle media: either from uploaded file (multer) or from pre-uploaded URL (S3 flow)
    let mediaData = [];

    if (req.file) {
      // Local multer upload
      const serverUrl = process.env.NODE_ENV === "production" ? "" : `http://localhost:${process.env.PORT || 5001}`;
      const fileUrl = `${serverUrl}/uploads/${req.file.filename}`;
      const mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
      mediaData = [{ url: fileUrl, type: mediaType }];
    } else if (req.body.mediaUrl && req.body.mediaType) {
      // Pre-uploaded (S3 flow)
      mediaData = [{ url: req.body.mediaUrl, type: req.body.mediaType }];
    }

    const post = await Post.create({
      title,
      content: content || "",
      media: mediaData,
      author: userId,
      community: communityId,
      score: Date.now() / 1000, // Initial Reddit-like score based on timestamp
    });

    // Update community posts count
    community.postsCount += 1;
    await community.save();

    // Populate author before sending back
    const populatedPost = await Post.findById(post._id)
      .populate("author", "fullName profilePic")
      .populate("community", "name avatar");

    res.status(201).json({ success: true, post: populatedPost });
  } catch (error) {
    console.error("Error in createPost controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Get posts within a community
export async function getCommunityPosts(req, res) {
  try {
    const { nameOrId } = req.params;
    const { sort = "new", page = 1, limit = 10 } = req.query;

    let query = {};
    if (nameOrId.match(/^[0-9a-fA-F]{24}$/)) {
      query = { community: nameOrId };
    } else {
      const community = await Community.findOne({ name: nameOrId.toLowerCase() });
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      query = { community: community._id };
    }

    const skipCount = (parseInt(page) - 1) * parseInt(limit);
    let sortQuery = { createdAt: -1 };

    if (sort === "hot") {
      sortQuery = { score: -1, createdAt: -1 };
    } else if (sort === "top") {
      sortQuery = { upvotesCount: -1, createdAt: -1 };
    }

    const posts = await Post.find(query)
      .sort(sortQuery)
      .skip(skipCount)
      .limit(parseInt(limit))
      .populate("author", "fullName profilePic")
      .populate("community", "name avatar");

    const totalPosts = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalPosts / parseInt(limit)),
        hasMore: skipCount + posts.length < totalPosts,
      },
    });
  } catch (error) {
    console.error("Error in getCommunityPosts controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Fetch single post details
export async function getPostDetails(req, res) {
  try {
    const { id } = req.params;
    const post = await Post.findById(id)
      .populate("author", "fullName profilePic")
      .populate("community", "name avatar description");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ success: true, post });
  } catch (error) {
    console.error("Error in getPostDetails controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Delete post
export async function deletePost(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is author
    let isAuthorized = post.author.toString() === userId;

    if (!isAuthorized) {
      // Check if user is owner/moderator of the community
      const membership = await CommunityMember.findOne({ community: post.community, user: userId });
      if (membership && ["owner", "moderator"].includes(membership.role)) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: "You are not authorized to delete this post" });
    }

    await Post.deleteOne({ _id: id });

    // Decrement posts count in community
    await Community.findByIdAndUpdate(post.community, { $inc: { postsCount: -1 } });

    res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error in deletePost controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Get global home feed posts (cached with Redis)
export async function getFeedPosts(req, res) {
  try {
    const userId = req.user.id;
    const { sort = "new", page = 1, limit = 10 } = req.query;

    const cacheKey = `feed:${userId}:${sort}:${page}:${limit}`;
    
    // Attempt to load from cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    // Get user's joined communities
    const memberships = await CommunityMember.find({ user: userId }).select("community");
    const joinedIds = memberships.map((m) => m.community);

    // Fetch all public communities to show on global home feed
    const publicCommunities = await Community.find({ type: "public" }).select("_id");
    const publicIds = publicCommunities.map((c) => c._id);

    // Combine joined and public IDs to ensure a populated home feed
    const combinedIds = Array.from(
      new Set([
        ...joinedIds.map((id) => id.toString()),
        ...publicIds.map((id) => id.toString()),
      ])
    );

    const query = { community: { $in: combinedIds } };
    const skipCount = (parseInt(page) - 1) * parseInt(limit);
    
    let sortQuery = { createdAt: -1 };
    if (sort === "hot") {
      sortQuery = { score: -1, createdAt: -1 };
    } else if (sort === "top") {
      sortQuery = { upvotesCount: -1, createdAt: -1 };
    }

    const posts = await Post.find(query)
      .sort(sortQuery)
      .skip(skipCount)
      .limit(parseInt(limit))
      .populate("author", "fullName profilePic")
      .populate("community", "name avatar");

    const totalPosts = await Post.countDocuments(query);

    const responsePayload = {
      success: true,
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalPosts / parseInt(limit)),
        hasMore: skipCount + posts.length < totalPosts,
      },
    };

    // Save to Redis cache for 15 seconds to prevent spamming queries
    await redis.set(cacheKey, JSON.stringify(responsePayload), "EX", 15);

    res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Error in getFeedPosts controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
