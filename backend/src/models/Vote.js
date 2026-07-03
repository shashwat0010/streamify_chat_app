import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
    targetType: {
      type: String,
      required: true,
      enum: ["Post", "Comment"],
    },
    voteType: {
      type: Number,
      required: true,
      enum: [1, -1], // 1 for upvote, -1 for downvote
    },
  },
  { timestamps: true }
);

// Enforce unique vote per user per target (Post/Comment)
voteSchema.index({ user: 1, targetId: 1 }, { unique: true });
// Index on targetId for quickly calculating counts
voteSchema.index({ targetId: 1 });

const Vote = mongoose.model("Vote", voteSchema);

export default Vote;
