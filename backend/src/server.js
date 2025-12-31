import express from "express";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // Explicit path for local dev
console.log("Mongo URI loaded:", !!process.env.MONGO_URI); // Debug log
console.log("Redis URL loaded:", !!process.env.REDIS_URL); // Debug log
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import http from "http";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import friendRoutes from "./routes/friend.route.js";
import meetingRoutes from "./routes/meeting.route.js";

import { connectDB } from "./lib/db.js";
import { initSocket } from "./lib/socket.js";
import { connectRedis } from "./lib/redis.js";

const app = express();
const PORT = process.env.PORT;

const __dirname = path.resolve();

app.use(
  cors({
    origin: process.env.NODE_ENV === "production"
      ? [process.env.CLIENT_URL, "https://streamify-frontend-8k08.onrender.com"]
      : ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true, // allow frontend to send cookies
  })
);

app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);
initSocket(server);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/meetings", meetingRoutes);

console.log("Environment:", process.env.NODE_ENV);
const frontendDist = path.join(__dirname, "frontend", "dist");
console.log("Serving static files from:", frontendDist);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(frontendDist));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is running successfully. <br> If you see this in production, set NODE_ENV=production in your environment variables.");
  });
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
  connectRedis();
});
