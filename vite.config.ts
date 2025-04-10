import { reactRouter } from '@react-router/dev/vite'
import {
	sentryReactRouter,
	type SentryReactRouterBuildOptions,
} from '@sentry/react-router'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const sentryConfig: SentryReactRouterBuildOptions = {
	authToken: process.env.SENTRY_AUTH_TOKEN,
	org: process.env.SENTRY_ORG,
	project: process.env.SENTRY_PROJECT,
}

export default defineConfig((config) => ({
	plugins: [
		tsconfigPaths(),
		tailwindcss(),
		reactRouter(),
		sentryReactRouter(sentryConfig, config),
	],
	sentryConfig,
}))
