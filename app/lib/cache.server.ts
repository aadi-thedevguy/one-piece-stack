import {
  cachified as baseCachified,
  type Cache,
  type CacheEntry,
  type Cache as CachifiedCache,
  type CachifiedOptions,
  type CreateReporter,
  mergeReporters,
  totalTtl,
  verboseReporter,
} from "@epic-web/cachified";
import { remember } from "@epic-web/remember";
import { Redis } from "ioredis";
import { LRUCache } from "lru-cache";
import { cachifiedTimingReporter, type Timings } from "./timing.server";
import { cacheEntrySchema } from "./validations";

const lru = remember(
  "lru-cache",
  () => new LRUCache<string, CacheEntry<unknown>>({ max: 5000 })
);

export const lruCache = {
  name: "app-memory-cache",
  set: (key, value) => {
    const ttl = totalTtl(value?.metadata);
    lru.set(key, value, {
      ttl: ttl === Number.POSITIVE_INFINITY ? undefined : ttl,
      start: value?.metadata?.createdTime,
    });
    return value;
  },
  get: (key) => lru.get(key),
  delete: (key) => lru.delete(key),
} satisfies Cache;

export const redis = remember<Redis | null>("redis", () => {
  const url = process.env.REDIS_URL;

  if (!url) {
    console.warn("REDIS_URL is not defined — falling back to in-memory cache");
    return null;
  }

  return new Redis(url);
});

const isBuffer = (obj: unknown): obj is Buffer =>
  Buffer.isBuffer(obj) || obj instanceof Uint8Array;

function bufferReplacer(_key: string, value: unknown) {
  if (isBuffer(value)) {
    return {
      __isBuffer: true,
      data: value.toString("base64"),
    };
  }
  return value;
}

function bufferReviver(_key: string, value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "__isBuffer" in value &&
    (value as any).data
  ) {
    return Buffer.from((value as any).data, "base64");
  }
  return value;
}

export const cache: CachifiedCache = redis
  ? {
      name: "Redis cache",
      async get(key) {
        const result = await redis.get(key);
        if (!result) return null;
        try {
          const parsed = JSON.parse(result, bufferReviver);
          const entry = cacheEntrySchema.safeParse(parsed);
          if (!entry.success) return null;
          return entry.data as CacheEntry<unknown>;
        } catch {
          return null;
        }
      },
      async set(key, entry) {
        const ttl = totalTtl(entry?.metadata);
        const value = JSON.stringify(entry, bufferReplacer);
        if (ttl > 0 && ttl < Number.POSITIVE_INFINITY) {
          await redis.set(key, value, "PX", ttl);
        } else {
          await redis.set(key, value);
        }
      },
      async delete(key) {
        await redis.del(key);
      },
    }
  : lruCache;

export async function getAllCacheKeys(limit: number) {
  const keys: string[] = [];
  if (redis) {
    const stream = redis.scanStream({ count: limit, match: "*" });
    for await (const resultKeys of stream) {
      keys.push(...resultKeys);
      if (keys.length >= limit) break;
    }
  }
  return {
    redis: keys.slice(0, limit),
    lru: [...lru.keys()],
  };
}

export async function searchCacheKeys(search: string, limit: number) {
  const keys: string[] = [];
  if (redis) {
    const stream = redis.scanStream({ count: limit, match: `*${search}*` });
    for await (const resultKeys of stream) {
      keys.push(...resultKeys);
      if (keys.length >= limit) break;
    }
  }
  return {
    redis: keys.slice(0, limit),
    lru: [...lru.keys()].filter((key) => key.includes(search)),
  };
}

export async function cachified<Value>(
  {
    timings,
    ...options
  }: CachifiedOptions<Value> & {
    timings?: Timings;
  },
  reporter: CreateReporter<Value> = verboseReporter<Value>()
): Promise<Value> {
  return baseCachified(
    options,
    mergeReporters(cachifiedTimingReporter(timings), reporter)
  );
}
