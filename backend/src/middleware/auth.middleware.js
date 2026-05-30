import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import User from "../models/User.js";

// We use ClerkExpressWithAuth instead of RequireAuth to prevent unhandled exceptions
// and allow us to manually check and log the exact auth state.
export const requireAuth = ClerkExpressWithAuth();

export const protectRoute = [
  requireAuth,
  async (req, res, next) => {
    try {
      if (!req.auth || !req.auth.userId) {
        console.log("Unauthorized request received. Headers:", req.headers.authorization ? "Present" : "Missing");
        return res.status(401).json({ message: "Unauthorized - No valid Clerk token provided" });
      }

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
