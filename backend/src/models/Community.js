import mongoose from "mongoose";

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    banner: {
      type: String,
      default: "",
    },
    membersCount: {
      type: Number,
      default: 1,
    },
    postsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index name for fast lookups and text searches
communitySchema.index({ name: "text", description: "text" });

const Community = mongoose.model("Community", communitySchema);

export default Community;
