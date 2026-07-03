import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    upvotesCount: {
      type: Number,
      default: 0,
    },
    downvotesCount: {
      type: Number,
      default: 0,
    },
    repliesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for fast retrieval of comments for a post or sub-comments
commentSchema.index({ post: 1, parentComment: 1, createdAt: 1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
