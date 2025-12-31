import { createClient } from "redis";
import "dotenv/config";

// Only create client if URL is provided or we intend to use localhost
// To avoid "wrong version number" SSL errors on localhost, we should ensure the protocol matches.
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = createClient({
    url: redisUrl,
    socket: {
        // If you are using TLS (rediss://), this might be needed.
        // But for localhost (redis://), it shouldn't be.
        // However, some setups might error if this is not handled correctly.
        tls: redisUrl.startsWith("rediss://"),
        rejectUnauthorized: false
    }
});

redisClient.on("error", (err) => {
    // Suppress repeated SSL errors for DX
    if (err.message?.includes("wrong version number")) return;
    console.log("Redis Client Error", err);
});

export const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
            console.log("Connected to Redis");
        }
    } catch (error) {
        // Suppress connection errors to allow server to start without Redis
        console.warn("Redis Connection Failed (Functionality will be limited):", error.message);
    }
};

export default redisClient;
