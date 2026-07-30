import { z } from "zod";

const schema = z
  .object({
    NODE_ENV: z.enum(["production", "development"] as const),
    DATABASE_URL: z.string(),
    SERVER_URL: z.string(),
    CORS_ORIGIN: z.string(),
    SESSION_SECRET: z.string(),
    HONEYPOT_SECRET: z.string(),
    REDIS_URL: z.string().optional(),
    SENTRY_DSN: z.string(),

    EMAIL_PROVIDER: z.enum(["resend", "ses"] as const).default("resend"),
    EMAIL_FROM: z.string(),
    RESEND_API_KEY: z.string().optional(),

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
  })
  .superRefine((env, ctx) => {
    if (env.EMAIL_PROVIDER === "resend" && !env.RESEND_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: "RESEND_API_KEY is required when EMAIL_PROVIDER is resend",
      });
    }
  });

declare global {
  // biome-ignore lint/style/noNamespace: Merging with NodeJS.ProcessEnv
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
