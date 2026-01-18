import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { rateLimiter } from "hono-rate-limiter";

const IS_PROD = process.env.NODE_ENV === "production";
const maxMultiple =
  !IS_PROD || process.env.PLAYWRIGHT_TEST_BASE_URL ? 10_000 : 1;

type RateLimit = Parameters<typeof rateLimiter>[0];

const rateLimitDefault: RateLimit = {
  windowMs: 60 * 1000, // 1 minute
  limit: 1000 * maxMultiple,
  keyGenerator: (c: Context) => {
    const info = getConnInfo(c);
    return c.req.header("cf-connecting-ip") || info.remote.address || "";
  },
};

const strongestRateLimit = rateLimiter({
  ...rateLimitDefault,
  limit: 10 * maxMultiple,
});

const strongRateLimit = rateLimiter({
  ...rateLimitDefault,
  limit: 100 * maxMultiple,
});

const generalRateLimit = rateLimiter(rateLimitDefault);

// Middleware pour gérer les limitations
export const rateLimitMiddleware = createMiddleware(async (c, next) => {
  const path = c.req.url;
  const method = c.req.method;

  const strongPaths = [
    "/login",
    "/signup",
    "/verify",
    "/admin",
    "/onboarding",
    "/reset-password",
    "/settings/profile",
    "/resources/login",
    "/resources/verify",
  ];

  // Vérification des méthodes et des chemins
  const isStrongPath = strongPaths.some((p) => path.includes(p));

  // Limitation de débit selon la méthode et le chemin
  if (method !== "GET" && method !== "HEAD") {
    return isStrongPath
      ? strongestRateLimit(c, next)
      : strongRateLimit(c, next);
  }

  // Cas spécial pour /verify
  if (path.includes("/verify")) {
    return strongestRateLimit(c, next);
  }

  // Limitation générale
  return generalRateLimit(c, next);
});
