import crypto from 'node:crypto'
import { createRequestHandler } from '@react-router/express'
import compression from 'compression'
import express from 'express'
import morgan from 'morgan'
import closeWithGrace from 'close-with-grace'
import rateLimit from 'express-rate-limit'
import { styleText } from 'node:util'
// import Redis from "ioredis"
// import { RedisStore } from 'rate-limit-redis'

const MODE = process.env.NODE_ENV ?? 'development'

const viteDevServer =
	process.env.NODE_ENV === 'production'
		? undefined
		: await import('vite').then((vite) =>
				vite.createServer({
					server: { middlewareMode: true },
				})
			)

const app = express()

const getHost = (req) => req.get('X-Forwarded-Host') ?? req.get('host') ?? ''

// fly is our proxy
app.set('trust proxy', true)

// ensure HTTPS only (X-Forwarded-Proto comes from Fly)
app.use((req, res, next) => {
	const proto = req.get('X-Forwarded-Proto')
	const host = getHost(req)
	if (proto === 'http') {
		res.set('X-Forwarded-Proto', 'https')
		res.redirect(`https://${host}${req.originalUrl}`)
		return
	}
	next()
})

app.use(compression())

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by')

// handle asset requests
if (viteDevServer) {
	app.use(viteDevServer.middlewares)
} else {
	// Vite fingerprints its assets so we can cache forever.
	app.use(
		'/assets',
		express.static('build/client/assets', { immutable: true, maxAge: '1y' })
	)
}

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static('build/client', { maxAge: '1h' }))

app.get(['/img/*', '/favicons/*'], (_req, res) => {
	// if we made it past the express.static for these, then we're missing something.
	// So we'll just send a 404 and won't bother calling other middleware.
	return res.status(404).send('Not found')
})

morgan.token('url', (req) => decodeURIComponent(req.url ?? ''))
app.use(morgan('tiny'))

app.use((_, res, next) => {
	res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
	next()
})

// redis store
// const client = new Redis(process.env.REDIS_URL)

const maxMultiple = process.env.MODE !== 'production' ? 10_000 : 1

const rateLimitDefault = {
	windowMs: 60 * 1000,
	max: 1000 * maxMultiple,
	standardHeaders: true,
	legacyHeaders: false,
	validate: { trustProxy: false },
	// Malicious users can spoof their IP address which means we should not deault
	// to trusting req.ip when hosted on Fly.io. However, users cannot spoof Fly-Client-Ip.
	// When sitting behind a CDN such as cloudflare, replace fly-client-ip with the CDN
	// specific header such as cf-connecting-ip
	keyGenerator: (req) => {
		return req.get('fly-client-ip') ?? `${req.ip}`
	},
	// Redis store configuration
	// store : new RedisStore({
	//   prefix : 'default:',
	//   sendCommand: (...args) => client.call(...args),
	// }),
}

const strongestRateLimit = rateLimit({
	windowMs: 60 * 1000,
	max: 10 * maxMultiple,
	standardHeaders: true,
	legacyHeaders: false,
	validate: { trustProxy: false },
	keyGenerator: (req) => {
		return req.get('fly-client-ip') ?? `${req.ip}`
	},
	// Redis store configuration
	// store : new RedisStore({
	//   prefix : 'strongest:',
	//   sendCommand: (...args) => client.call(...args),
	// }),
})

const strongRateLimit = rateLimit({
	windowMs: 60 * 1000,
	max: 100 * maxMultiple,
	standardHeaders: true,
	legacyHeaders: false,
	validate: { trustProxy: false },
	keyGenerator: (req) => {
		return req.get('fly-client-ip') ?? `${req.ip}`
	},
	// Redis store configuration
	// store : new RedisStore({
	//   prefix : 'strong:',
	//   sendCommand: (...args) => client.call(...args),
	// }),
})

const generalRateLimit = rateLimit(rateLimitDefault)
app.use((req, res, next) => {
	const strongPaths = [
		'/login',
		'/signup',
		'/verify',
		'/admin',
		'/reset-password',
	]
	if (req.method !== 'GET' && req.method !== 'HEAD') {
		if (strongPaths.some((p) => req.path.includes(p))) {
			return strongestRateLimit(req, res, next)
		}
		return strongRateLimit(req, res, next)
	}

	// the verify route is a special case because it's a GET route that
	// can have a token in the query string
	if (req.path.includes('/verify')) {
		return strongestRateLimit(req, res, next)
	}

	return generalRateLimit(req, res, next)
})

async function getBuild() {
	try {
		const build = viteDevServer
			? await viteDevServer.ssrLoadModule(
					'virtual:react-router/server-build'
				)
			: // @ts-expect-error - the file might not exist yet but it will
				await import('./build/server/index.js')

		return { build: build, error: null }
	} catch (error) {
		// Catch error and return null to make express happy and avoid an unrecoverable crash
		console.error('Error creating build:', error)
		return { error: error, build: null }
	}
}

app.all(
	'*',
	createRequestHandler({
		getLoadContext: (_, res) => ({
			cspNonce: res.locals.cspNonce,
			serverBuild: getBuild(),
		}),
		mode: MODE,
		build: async () => {
			const { error, build } = await getBuild()
			// gracefully "catch" the error
			if (error) {
				throw error
			}
			return build
		},
	})
)

const port = process.env.PORT || 3000
const server = app.listen(port, () =>
	console.log(`Express server listening at http://localhost:${port}`)
)

closeWithGrace(async ({ err }) => {
	await new Promise((resolve, reject) => {
		server.close((e) => (e ? reject(e) : resolve('ok')))
	})
	if (err) {
		console.error(styleText('red', String(err)))
		console.error(styleText('red', String(err.stack)))
		if (SENTRY_ENABLED) {
			Sentry.captureException(err)
			await Sentry.flush(500)
		}
	}
})
