import mongoose from "mongoose";

const communityMemberSchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "moderator", "member"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Enforce that a user can only have one membership record per community
communityMemberSchema.index({ community: 1, user: 1 }, { unique: true });
// Index on user for listing user's joined communities
communityMemberSchema.index({ user: 1 });

const CommunityMember = mongoose.model("CommunityMember", communityMemberSchema);

export default CommunityMember;
