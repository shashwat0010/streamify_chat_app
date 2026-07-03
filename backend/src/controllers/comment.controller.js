import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import Vote from "../models/Vote.js";
import Bookmark from "../models/Bookmark.js";
import { triggerNotification } from "./notification.controller.js";

// Create a comment (supports top-level and nested replies)
export async function createComment(req, res) {
  try {
    const { content, postId, parentCommentId } = req.body;
    const userId = req.user.id;

    if (!content || !postId) {
      return res.status(400).json({ message: "Content and postId are required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
      parentComment.repliesCount += 1;
      await parentComment.save();
    }

    const comment = await Comment.create({
      content,
      post: postId,
      parentComment: parentCommentId || null,
      author: userId,
    });

    // Increment commentsCount in Post
    post.commentsCount += 1;
    await post.save();

    const populatedComment = await Comment.findById(comment._id).populate("author", "fullName profilePic");

    // Trigger notification side effect
    if (parentCommentId) {
      const parent = await Comment.findById(parentCommentId);
      if (parent) {
        await triggerNotification({
          recipient: parent.author,
          sender: userId,
          type: "reply",
          post: postId,
          comment: comment._id,
        });
      }
    } else {
      await triggerNotification({
        recipient: post.author,
        sender: userId,
        type: "comment",
        post: postId,
        comment: comment._id,
      });
    }

    res.status(201).json({ success: true, comment: populatedComment });
  } catch (error) {
    console.error("Error in createComment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Get all comments for a post (returned flat for tree reconstruction in frontend)
export async function getPostComments(req, res) {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: 1 })
      .populate("author", "fullName profilePic");

    res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error("Error in getPostComments:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Cast or update a vote on a Post or Comment
export async function castVote(req, res) {
  try {
    const { targetId, targetType, voteType } = req.body; // voteType is 1 or -1
    const userId = req.user.id;

    if (!targetId || !targetType || ![1, -1].includes(voteType)) {
      return res.status(400).json({ message: "Invalid voting payload" });
    }

    if (!["Post", "Comment"].includes(targetType)) {
      return res.status(400).json({ message: "Invalid target type" });
    }

    // Check if target exists
    const TargetModel = targetType === "Post" ? Post : Comment;
    const target = await TargetModel.findById(targetId);
    if (!target) {
      return res.status(404).json({ message: `${targetType} not found` });
    }

    // Find existing vote
    const existingVote = await Vote.findOne({ user: userId, targetId });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Toggle vote OFF (remove vote)
        await Vote.deleteOne({ _id: existingVote._id });
      } else {
        // Swap vote type
        existingVote.voteType = voteType;
        await existingVote.save();
      }
    } else {
      // Create new vote
      await Vote.create({
        user: userId,
        targetId,
        targetType,
        voteType,
      });
    }

    // Re-tally votes count on the target document
    const upvotesCount = await Vote.countDocuments({ targetId, voteType: 1 });
    const downvotesCount = await Vote.countDocuments({ targetId, voteType: -1 });

    target.upvotesCount = upvotesCount;
    target.downvotesCount = downvotesCount;

    // If target is Post, update trending score
    if (targetType === "Post") {
      const voteDifference = upvotesCount - downvotesCount;
      const secondsSinceEpoch = target.createdAt.getTime() / 1000;
      // Reddit-style Score: Logarithmic scale of vote diff + time weight
      const sign = voteDifference > 0 ? 1 : voteDifference < 0 ? -1 : 0;
      const order = Math.log10(Math.max(1, Math.abs(voteDifference)));
      target.score = sign * order + secondsSinceEpoch / 45000;
    }

    await target.save();

    // Trigger notification for upvotes
    if (voteType === 1) {
      await triggerNotification({
        recipient: target.author,
        sender: userId,
        type: "upvote",
        post: targetType === "Post" ? targetId : null,
        comment: targetType === "Comment" ? targetId : null,
      });
    }

    res.status(200).json({
      success: true,
      upvotesCount,
      downvotesCount,
      userVote: existingVote && existingVote.voteType === voteType ? 0 : voteType,
    });
  } catch (error) {
    console.error("Error in castVote:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Toggle bookmark on a post
export async function toggleBookmark(req, res) {
  try {
    const { postId } = req.body;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const existingBookmark = await Bookmark.findOne({ user: userId, post: postId });

    if (existingBookmark) {
      await Bookmark.deleteOne({ _id: existingBookmark._id });
      return res.status(200).json({ success: true, bookmarked: false, message: "Removed from bookmarks" });
    } else {
      await Bookmark.create({ user: userId, post: postId });
      return res.status(201).json({ success: true, bookmarked: true, message: "Saved to bookmarks" });
    }
  } catch (error) {
    console.error("Error in toggleBookmark:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Get current user's bookmarked posts
export async function getBookmarkedPosts(req, res) {
  try {
    const userId = req.user.id;

    const bookmarks = await Bookmark.find({ user: userId })
      .populate({
        path: "post",
        populate: [
          { path: "author", select: "fullName profilePic" },
          { path: "community", select: "name avatar" },
        ],
      })
      .sort({ createdAt: -1 });

    const posts = bookmarks.filter((b) => b.post !== null).map((b) => b.post);

    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error("Error in getBookmarkedPosts:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Get user votes on posts (to set upvote/downvote arrows color)
export async function getUserVotes(req, res) {
  try {
    const userId = req.user.id;
    const votes = await Vote.find({ user: userId });

    const votesMap = {};
    votes.forEach((v) => {
      votesMap[v.targetId.toString()] = v.voteType;
    });

    res.status(200).json({ success: true, votes: votesMap });
  } catch (error) {
    console.error("Error in getUserVotes:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Get user bookmarks map (to set saved bookmark icon color)
export async function getUserBookmarksMap(req, res) {
  try {
    const userId = req.user.id;
    const bookmarks = await Bookmark.find({ user: userId });

    const bookmarksMap = {};
    bookmarks.forEach((b) => {
      bookmarksMap[b.post.toString()] = true;
    });

    res.status(200).json({ success: true, bookmarks: bookmarksMap });
  } catch (error) {
    console.error("Error in getUserBookmarksMap:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
