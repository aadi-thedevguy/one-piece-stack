import { createCookieSessionStorage } from '@remix-run/node'

const session_secret: string = process.env.SESSION_SECRET!

export const sessionStorage = createCookieSessionStorage({
	cookie: {
		name: '__aurelius_session',
		sameSite: 'lax',
		path: '/',
		httpOnly: true,
		secrets: [session_secret],
		secure: process.env.NODE_ENV === 'production',
	},
})

export const { getSession, commitSession, destroySession } = sessionStorage
