import * as Sentry from "@sentry/react-router";
import { compress } from "hono/compress";
import { createMiddleware } from "hono/factory";
import { poweredBy } from "hono/powered-by";
import { Hono } from "hono/quick";
import { serve } from "inngest/hono";
import {
  createContext,
  RouterContextProvider,
  type ServerBuild,
} from "react-router";
import { createHonoServer } from "react-router-hono-server/node";
import { functions, inngest } from "../app/lib/inngest.server";
import { cspNonceMiddleware } from "./middleware/cspnonce";
import { epicLogger } from "./middleware/epic-logger";
import { ALLOW_INDEXING } from "./middleware/misc";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { removeTrailingSlash } from "./middleware/remove-trailing-slash";
import { secureHeadersMiddleware } from "./middleware/secure";

// Shared context key for passing the built routes into loaders (e.g. sitemap)
export const serverBuildContext = createContext<{
  build: ServerBuild;
  nonce: string;
} | null>(null);

export default createHonoServer({
  app: new Hono(),
  defaultLogger: false,
  hostname: "0.0.0.0",
  getLoadContext: (_c, { build }) => {
    const ctx = new RouterContextProvider();
    ctx.set(serverBuildContext, {
      build,
      nonce: _c.get("cspNonce" as never) as string,
    });
    return ctx;
  },
  configure: (server) => {
    server.use("*", epicLogger({ logName: "One Piece Stack" }));
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
    server.use("*", poweredBy({ serverName: "One Piece Stack" }));

    server.on("GET", ["/favicons/*", "/img/*"], (c) =>
      c.text("Not found", 404)
    );

    server.on(
      ["GET", "PUT", "POST"],
      "/api/inngest",
      serve({
        client: inngest,
        functions,
      })
    );

    server.on(
      ["GET", "PUT", "POST"],
      "/api/inngest",
      serve({
        client: inngest,
        functions,
      })
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
      Sentry.captureException(err);
      await Sentry.flush(500);
      return c.text("Internal Server Error", 500);
    });
  },
});
