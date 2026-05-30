import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import User from "../models/User.js";

// First, we run Clerk's middleware to verify the Bearer token.
// Then we run our custom middleware to populate req.user from MongoDB, 
// because other routes rely on req.user._id, req.user.friends, etc.

export const requireAuth = ClerkExpressRequireAuth();

export const protectRoute = [
  requireAuth,
  async (req, res, next) => {
    try {
      const clerkUserId = req.auth.userId;
      
      const user = await User.findOne({ clerkId: clerkUserId });
      
      // If we are hitting /auth/me, the user might not exist in MongoDB yet
      // because getMe is responsible for syncing them! So we skip this check for /auth/me.
      if (!user && req.path !== '/me') {
        return res.status(401).json({ message: "Unauthorized - User not synced to DB yet" });
      }

      if (user) {
        req.user = user;
      }
      
      next();
    } catch (error) {
      console.log("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
];
