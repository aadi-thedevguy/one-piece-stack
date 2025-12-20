/** biome-ignore-all lint/style/noNamespace: <explanation> */
/** biome-ignore-all lint/nursery/useConsistentTypeDefinitions: <explanation> */

import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["production", "development", "test"] as const),
  DATABASE_URL: z.string(),
  SERVER_URL: z.string(),
  CORS_ORIGIN: z.string(),
  SESSION_SECRET: z.string(),
  HONEYPOT_SECRET: z.string(),
  // Uncomment below if you are using Redis
  // REDIS_URL: z.string(),
  SENTRY_DSN: z.string(),
  RESEND_API_KEY: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_BUCKET: z.string(),
  // TWITTER_CLIENT_ID: z.string().default('TWITTER_CLIENT_ID'),
  // TWITTER_CLIENT_SECRET: z.string().default('TWITTER_CLIENT_SECRET'),
  GOOGLE_CLIENT_ID: z.string().default("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: z.string().default("GOOGLE_CLIENT_SECRET"),
  DODO_PAYMENTS_API_KEY: z.string(),
  DODO_PAYMENTS_WEBHOOK_SECRET: z.string(),
  ALLOW_INDEXING: z.enum(["true", "false"]).optional(),

  // Object Storage Configuration
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_REGION: z.string(),
  AWS_ENDPOINT_URL_S3: z.string().url(),
  BUCKET_NAME: z.string(),
});

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof schema> {}
  }
}

export function init() {
  const parsed = schema.safeParse(process.env);

  if (parsed.success === false) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors
    );

    throw new Error("Invalid environment variables");
  }
}

/**
 * This is used in both `entry.server.ts` and `root.tsx` to ensure that
 * the environment variables are set and globally available before the app is
 * started.
 *
 * NOTE: Do *not* add any environment variables in here that you do not wish to
 * be included in the client.
 * @returns all public ENV variables
 */
export function getEnv() {
  return {
    MODE: process.env.NODE_ENV,
    SENTRY_DSN: process.env.SENTRY_DSN,
    ALLOW_INDEXING: process.env.ALLOW_INDEXING,
    SERVER_URL: process.env.SERVER_URL,
  };
}

type ENV = ReturnType<typeof getEnv>;

declare global {
  var ENV: ENV;
  interface Window {
    ENV: ENV;
  }
}
