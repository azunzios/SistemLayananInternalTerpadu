import { createClient } from "redis";

let client = null;

async function getClient() {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL,
    });
    client.on("error", (err) => console.error("Redis error:", err));
    await client.connect();
  }
  return client;
}

export default async function handler(req, res) {
  try {
    const redis = await getClient();
    const count = await redis.incr("visitor_count");
    return res.status(200).json({ visitors: count });
  } catch (error) {
    console.error("Redis error:", error);
    return res.status(500).json({ visitors: 0, error: "Redis error" });
  }
}
