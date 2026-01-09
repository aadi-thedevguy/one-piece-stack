import { compress } from "hono/compress";
import { createMiddleware } from "hono/factory";
import { poweredBy } from "hono/powered-by";
import { Hono } from "hono/quick";
import {
  createContext,
  RouterContextProvider,
  type ServerBuild,
} from "react-router";

import { createHonoServer } from "react-router-hono-server/node";
import { cspNonceMiddleware } from "./middleware/cspnonce";
import { epicLogger } from "./middleware/epic-logger";
import { ALLOW_INDEXING } from "./middleware/misc";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { removeTrailingSlash } from "./middleware/remove-trailing-slash";
import { secureHeadersMiddleware } from "./middleware/secure";

// const SENTRY_ENABLED = IS_PROD && process.env.SENTRY_DSN;

// if (SENTRY_ENABLED) {
//   void import("./monitoring").then(({ init }) => init());
// }

// Shared context key for passing the built routes into loaders (e.g. sitemap)
export const serverBuildContext = createContext<{
  build: ServerBuild;
  nonce: string;
} | null>(null);

export default await createHonoServer({
  app: new Hono(),
  defaultLogger: false,

  getLoadContext: (_c, { build }) => {
    const ctx = new RouterContextProvider();
    ctx.set(serverBuildContext, {
      build,
      nonce: _c.get("cspNonce") as string,
    });
    return ctx;
  },
  configure: (server) => {
    server.use("*", epicLogger());
    server.use(removeTrailingSlash);

    server.use("*", async (c, next) => {
      const proto = c.req.header("X-Forwarded-Proto");
      const host = c.req.header("Host");
      if (proto === "http") {
        const secureUrl = `https://${host}${c.req.url}`;
        return c.redirect(secureUrl, 301);
      }
      await next();
    });

    server.use(cspNonceMiddleware);
    server.use("*", secureHeadersMiddleware);
    server.use("*", rateLimitMiddleware);
    server.use("*", poweredBy({ serverName: "EPIC STACK" }));

    server.on("GET", ["/favicons/*", "/img/*"], (c) =>
      c.text("Not found", 404)
    );

    server.use(compress());

    if (!ALLOW_INDEXING) {
      server.use(
        createMiddleware(async (c, next) => {
          c.set("X-Robots-Tag", "noindex, nofollow");
          await next();
        })
      );
    }
    server.onError(async (err, c) => {
      console.error(`${err}`);
      // if (SENTRY_ENABLED) {
      //   Sentry.captureException(err);
      //   await Sentry.flush(500);
      // }
      return c.text("Internal Server Error", 500);
    });
  },
});
