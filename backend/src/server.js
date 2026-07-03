import express from "express";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // Explicit path for local dev
console.log("Mongo URI loaded:", !!process.env.MONGO_URI); // Debug log
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import http from "http";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import friendRoutes from "./routes/friend.route.js";
import meetingRoutes from "./routes/meeting.route.js";
import communityRoutes from "./routes/community.route.js";
import postRoutes from "./routes/post.route.js";
import commentRoutes from "./routes/comment.route.js";
import searchRoutes from "./routes/search.route.js";
import notificationRoutes from "./routes/notification.route.js";

import { connectDB } from "./lib/db.js";
import { initSocket } from "./lib/socket.js";

const app = express();
const PORT = process.env.PORT;

const __dirname = path.resolve();

app.use(
  cors({
    origin: process.env.NODE_ENV === "production"
      ? [process.env.CLIENT_URL, "https://streamify-frontend-8k08.onrender.com"]
      : ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true, // allow frontend to send cookies
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const server = http.createServer(app);
initSocket(server);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);

console.log("Environment:", process.env.NODE_ENV);
  app.get("/", (req, res) => {
    res.send("API is running successfully.");
  });

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
