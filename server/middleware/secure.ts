import type { Context, Next } from "hono";
import { secureHeaders } from "hono/secure-headers";

const secureHeadersConfig = secureHeaders({
  referrerPolicy: "same-origin",
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    fontSrc: ["'self'"],
    frameSrc: ["'self'"],
    mediaSrc: ["'self'", "data:"],
    // imgSrc: ["'self'", "data:"],
    scriptSrc: [
      "'strict-dynamic'",
      "'self'",
      (c, _) => `'nonce-${c.get("cspNonce")}'`,
    ],
    scriptSrcAttr: [(c, _) => `'nonce-${c.get("cspNonce")}'`],
  },
});

export const secureHeadersMiddleware = async (c: Context, next: Next) => {
  await next();
  // Check if the response is HTML before applying the CSP headers
  if (c.res.headers.get("Content-Type")?.includes("text/html")) {
    await secureHeadersConfig(c, () => Promise.resolve());
  }
};
