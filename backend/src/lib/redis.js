import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
let redisClient = null;
let isRedisConnected = false;

// Local in-memory store fallback
const localMemoryStore = new Map();

try {
  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        console.warn("Redis connection failed. Falling back to memory cache.");
        return null; // Stop retrying
      }
      return 1000;
    },
  });

  redisClient.on("connect", () => {
    console.log("Connected to Redis successfully.");
    isRedisConnected = true;
  });

  redisClient.on("error", (err) => {
    // Suppress spamming error logs, just handle fallback
    isRedisConnected = false;
  });
} catch (error) {
  console.warn("Could not initialize Redis client. Falling back to memory cache.");
}

const redisWrapper = {
  async get(key) {
    if (isRedisConnected && redisClient) {
      try {
        return await redisClient.get(key);
      } catch (err) {
        return localMemoryStore.get(key) || null;
      }
    }
    return localMemoryStore.get(key) || null;
  },

  async set(key, value, expiryMode, time) {
    if (isRedisConnected && redisClient) {
      try {
        if (expiryMode === "EX" && time) {
          return await redisClient.set(key, value, "EX", time);
        }
        return await redisClient.set(key, value);
      } catch (err) {
        localMemoryStore.set(key, value);
        return "OK";
      }
    }
    localMemoryStore.set(key, value);
    // Handle manual expiry in memory if needed
    if (expiryMode === "EX" && time) {
      setTimeout(() => localMemoryStore.delete(key), time * 1000);
    }
    return "OK";
  },

  async del(key) {
    if (isRedisConnected && redisClient) {
      try {
        return await redisClient.del(key);
      } catch (err) {
        return localMemoryStore.delete(key) ? 1 : 0;
      }
    }
    return localMemoryStore.delete(key) ? 1 : 0;
  },

  // Redis Sorted Set mock for trending posts
  async zadd(key, score, member) {
    if (isRedisConnected && redisClient) {
      try {
        return await redisClient.zadd(key, score, member);
      } catch (err) {
        // Fallback mock
      }
    }
    // Simple memory fallback
    if (!localMemoryStore.has(key)) {
      localMemoryStore.set(key, []);
    }
    const set = localMemoryStore.get(key);
    const existing = set.find((item) => item.member === member);
    if (existing) {
      existing.score = score;
    } else {
      set.push({ score, member });
    }
    set.sort((a, b) => b.score - a.score); // descending sort
    return 1;
  },

  async zrevrange(key, start, stop) {
    if (isRedisConnected && redisClient) {
      try {
        return await redisClient.zrevrange(key, start, stop);
      } catch (err) {
        // Fallback
      }
    }
    const set = localMemoryStore.get(key) || [];
    return set.slice(start, stop + 1).map((item) => item.member);
  },
  
  getClient() {
    return redisClient;
  },

  isAvailable() {
    return isRedisConnected;
  }
};

export default redisWrapper;
