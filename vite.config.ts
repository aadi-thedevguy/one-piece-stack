import { reactRouter } from "@react-router/dev/vite";
import { sentryVitePlugin } from '@sentry/vite-plugin'
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const MODE = process.env.NODE_ENV

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  plugins: [reactRouter(), tsconfigPaths(),
  process.env.SENTRY_AUTH_TOKEN
    ? sentryVitePlugin({
      disable: MODE !== 'production',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      release: {
        name: process.env.COMMIT_SHA,
        setCommits: {
          auto: true,
        },
      },
      sourcemaps: {
        filesToDeleteAfterUpload: [
          './build/**/*.map',
          '.server-build/**/*.map',
        ],
      },
    })
    : null
  ],
});
