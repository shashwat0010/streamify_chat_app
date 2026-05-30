import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import { createClerkClient } from "@clerk/clerk-sdk-node";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function getMe(req, res) {
  try {
    // req.auth is populated by ClerkExpressRequireAuth
    const clerkUserId = req.auth.userId;

    // First try to find by clerkId
    let user = await User.findOne({ clerkId: clerkUserId });

    if (!user) {
      // Get the full user info from Clerk to create/sync the user
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses[0].emailAddress;
      
      // Check if user exists by email (legacy migration)
      user = await User.findOne({ email });
      
      if (user) {
        // Link the existing user to the new Clerk ID
        user.clerkId = clerkUserId;
        // Verify them automatically since they logged in via Clerk
        user.isVerified = true;
        await user.save();
        console.log(`Migrated legacy user to Clerk: ${email}`);
      } else {
        // Create brand new user
        const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User';
        const profilePic = clerkUser.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`;
        
        user = await User.create({
          clerkId: clerkUserId,
          email,
          fullName,
          profilePic,
          isVerified: true,
          isOnboarded: false
        });
        console.log(`Created new user from Clerk: ${email}`);
      }
      
      // Upsert to Stream Chat
      try {
        await upsertStreamUser({
          id: user._id.toString(),
          name: user.fullName,
          image: user.profilePic || "",
        });
      } catch (error) {
        console.log("Error creating Stream user:", error);
      }
    }

    // Lazy migration for legacy avatars
    if (user.profilePic && (user.profilePic.includes("avatar.iran.liara.run") || user.profilePic.includes("ui-avatars.com"))) {
      user.profilePic = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.fullName)}`;
      await user.save();
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error in getMe controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;
    const { fullName, bio, nativeLanguage, learningLanguage, location } = req.body;

    if (!fullName || !bio || !nativeLanguage || !learningLanguage || !location) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { ...req.body, isOnboarded: true },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
    } catch (streamError) {
      console.log("Error updating Stream user during onboarding:", streamError.message);
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
