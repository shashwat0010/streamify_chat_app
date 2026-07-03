import Post from "../models/Post.js";
import Community from "../models/Community.js";
import User from "../models/User.js";

export async function searchAll(req, res) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({ success: true, posts: [], communities: [], users: [] });
    }

    const regex = new RegExp(q, "i");

    const [posts, communities, users] = await Promise.all([
      Post.find({
        $or: [{ title: regex }, { content: regex }],
      })
        .populate("author", "fullName profilePic")
        .populate("community", "name avatar")
        .limit(10),

      Community.find({
        $or: [{ name: regex }, { description: regex }],
      }).limit(10),

      User.find({
        $or: [{ fullName: regex }, { email: regex }],
        isOnboarded: true,
      })
        .select("fullName profilePic nativeLanguage learningLanguage bio location")
        .limit(10),
    ]);

    res.status(200).json({
      success: true,
      posts,
      communities,
      users,
    });
  } catch (error) {
    console.error("Error in searchAll controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
