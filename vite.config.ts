import { reactRouter } from "@react-router/dev/vite";
import {
  type SentryReactRouterBuildOptions,
  sentryReactRouter,
} from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import { reactRouterDevTools } from "react-router-devtools";
import { reactRouterHonoServer } from "react-router-hono-server/dev";
import { defineConfig } from "vite";
import { envOnlyMacros } from "vite-env-only";
import tsconfigPaths from "vite-tsconfig-paths";

const MODE = process.env.NODE_ENV;

export default defineConfig((config) => ({
  build: {
    target: "es2022",
    cssMinify: MODE === "production",
    sourcemap: true,
  },
  server: {
    port: 3000,
  },
  plugins: [
    envOnlyMacros(),
    tailwindcss(),
    tsconfigPaths(),
    reactRouterDevTools(),
    reactRouterHonoServer({ serverEntryPoint: "./server" }),
    MODE === "test" ? null : reactRouter(),
    MODE === "production" && process.env.SENTRY_AUTH_TOKEN
      ? sentryReactRouter(sentryConfig, config)
      : null,
  ],
}));

const sentryConfig: SentryReactRouterBuildOptions = {
  reactComponentAnnotation: { enabled: true },
  release: {
    name: process.env.COMMIT_SHA,
    inject: true,
  },
};
