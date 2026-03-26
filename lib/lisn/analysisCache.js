// lib/lisn/analysisCache.js
// Persistent cache using Upstash Redis (free tier: 10k req/day).
// Falls back to in-memory Map if Redis is not configured (local dev without .env).
// TTL: 30 days.

const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;
const memoryFallback = new Map();
const MEM_MAX = 300;

function memSet(key, value) {
  if (memoryFallback.size >= MEM_MAX) {
    memoryFallback.delete(memoryFallback.keys().next().value);
  }
  memoryFallback.set(key, value);
}

// ── Redis client (lazy init) ─────────────────────────────────────
let redis = null;
async function getRedis() {
  if (redis) return redis;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null; // not configured — use memory fallback
  try {
    const { Redis } = await import("@upstash/redis");
    redis = new Redis({ url, token });
    return redis;
  } catch {
    return null;
  }
}

// ── Public API ───────────────────────────────────────────────────
export function makeCacheKey(query, entityType, lang) {
  return `lisn:v4:${query.toLowerCase().trim()}::${entityType}::${lang}`;
}

export async function getFromCache(key) {
  try {
    const client = await getRedis();
    if (client) {
      const val = await client.get(key);
      if (val) {
        memSet(key, val);
        return val;
      }
    }
  } catch (e) {
    console.warn("[cache] Redis get failed:", e.message);
  }
  return memoryFallback.get(key) || null;
}

export async function setInCache(key, value) {
  memSet(key, value);
  try {
    const client = await getRedis();
    if (client) {
      await client.set(key, value, { ex: CACHE_TTL_SECONDS });
    }
  } catch (e) {
    console.warn("[cache] Redis set failed:", e.message);
  }
}
