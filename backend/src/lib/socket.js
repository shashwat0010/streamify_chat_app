import { Server } from "socket.io";
import http from "http";
import express from "express";

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.NODE_ENV === "production"
                ? [process.env.CLIENT_URL, "https://streamify-frontend-8k08.onrender.com"]
                : ["http://localhost:5173", "http://127.0.0.1:5173"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("A user connected", socket.id);

        // Join a room (meeting or private chat)
        socket.on("join-room", (roomId) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room ${roomId}`);
        });

        // Handle whiteboard drawing events
        socket.on("draw", ({ roomId, data }) => {
            socket.to(roomId).emit("draw", data);
        });

        // Handle clear canvas
        socket.on("clear-canvas", (roomId) => {
            socket.to(roomId).emit("clear-canvas");
        });

        // Handle friend requests (using userId as room)
        socket.on("join-user-room", (userId) => {
            socket.join(userId);
        });

        socket.on("send-friend-request", ({ recipientId, senderData }) => {
            io.to(recipientId).emit("new-friend-request", senderData);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected", socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
