import { reactRouter } from "@react-router/dev/vite";
import {
  type SentryReactRouterBuildOptions,
  sentryReactRouter,
} from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import { reactRouterDevTools } from "react-router-devtools";
import { defineConfig } from "vite";
import { envOnlyMacros } from "vite-env-only";
import tsconfigPaths from "vite-tsconfig-paths";

const MODE = process.env.NODE_ENV;

export default defineConfig((config) => ({
  build: {
    target: "es2022",
    cssMinify: MODE === "production",

    // rollupOptions: {
    //   input: config.isSsrBuild ? "./server/app.ts" : undefined,
    //   external: [/node:.*/, "fsevents"],
    // },
    sourcemap: true,
  },
  sentryConfig,
  plugins: [
    envOnlyMacros(),
    tailwindcss(),
    tsconfigPaths(),
    reactRouterDevTools(),
    MODE === "test" ? null : reactRouter(),
    MODE === "production" && process.env.SENTRY_AUTH_TOKEN
      ? sentryReactRouter(sentryConfig, config)
      : null,
  ],
}));

const sentryConfig: SentryReactRouterBuildOptions = {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
};
