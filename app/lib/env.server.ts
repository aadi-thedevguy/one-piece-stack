import { z } from 'zod'

const schema = z.object({
	NODE_ENV: z.enum(['production', 'development', 'test'] as const),
	DATABASE_URL: z.string(),
	SESSION_SECRET: z.string(),
	HONEYPOT_SECRET: z.string(),
	REDIS_URL: z.string(),
	SENTRY_DSN: z.string(),
	EMAIL_FROM_ADDRESS: z.string(),
	ADMIN_EMAIL: z.string(),
	EMAIL_PASSWORD: z.string(),
	SMTP_SERVER: z.string(),
	MY_AWS_S3_BUCKET: z.string(),
	MY_AWS_DEFAULT_REGION: z.string(),
	MY_AWS_ACCESS_KEY_ID: z.string(),
	MY_AWS_SECRET_ACCESS_KEY: z.string(),
	// TWITTER_CLIENT_ID: z.string().default('MOCK_TWITTER_CLIENT_ID'),
	// TWITTER_CLIENT_SECRET: z.string().default('MOCK_TWITTER_CLIENT_SECRET'),
	GOOGLE_CLIENT_ID: z.string().default('MOCK_GOOGLE_CLIENT_ID'),
	GOOGLE_CLIENT_SECRET: z.string().default('MOCK_GOOGLE_CLIENT_SECRET'),
	GITHUB_CLIENT_ID: z.string().default('MOCK_GITHUB_CLIENT_ID'),
	GITHUB_CLIENT_SECRET: z.string().default('MOCK_GITHUB_CLIENT_SECRET'),
	ALLOW_INDEXING: z.enum(['true', 'false']).optional(),
})

declare global {
	namespace NodeJS {
		interface ProcessEnv extends z.infer<typeof schema> { }
	}
}

export function init() {
	const parsed = schema.safeParse(process.env)

	if (parsed.success === false) {
		console.error(
			'❌ Invalid environment variables:',
			parsed.error.flatten().fieldErrors,
		)

		throw new Error('Invalid environment variables')
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
	}
}

type ENV = ReturnType<typeof getEnv>

declare global {
	var ENV: ENV
	interface Window {
		ENV: ENV
	}
}
