import { GoogleStrategy } from 'remix-auth-google'
import { GitHubStrategy } from "remix-auth-github";
import { Authenticator } from 'remix-auth'
import { ProviderUser } from '~/types'
import { createCookieSessionStorage } from '@remix-run/node'
import { redirectWithToast } from '../toast.server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string

if (!GOOGLE_CLIENT_ID)
	throw new Error('Missing GOOGLE_CLIENT_ID environment variable')
if (!GOOGLE_CLIENT_SECRET)
	throw new Error('Missing GOOGLE_CLIENT_SECRET environment variable')

export const connectionSessionStorage = createCookieSessionStorage({
	cookie: {
		name: 'en_connection',
		sameSite: 'lax', // CSRF protection is advised if changing to 'none'
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		secrets: process.env.SESSION_SECRET.split(','),
		secure: process.env.NODE_ENV === 'production',
	},
})

export const auth = new Authenticator<ProviderUser>(connectionSessionStorage)

auth.use(
	new GoogleStrategy(
		{
			clientID: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET,
			callbackURL: '/auth/google/callback',
		},
		async ({ profile }) => {
			const email = profile.emails[0]?.value.trim().toLowerCase()
			if (!email) {
				throw redirectWithToast('/login', {
					title: 'Cannot connect Google Account',
					description: 'Your Google Email is Unverified',
					type: 'error',
				})
			}
			const username = profile.displayName
			const imageUrl = profile.photos[0].value
			return {
				email,
				id: profile.id,
				username,
				name: profile.name.givenName,
				imageUrl,
			}
		}
	)
)

// GITHUB
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID as string
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET as string

if (!GITHUB_CLIENT_ID)
	throw new Error('Missing GITHUB_CLIENT_ID environment variable')
if (!GITHUB_CLIENT_SECRET)
	throw new Error('Missing GITHUB_CLIENT_SECRET environment variable')

// expires
auth.use(
	new GitHubStrategy(
		{
			clientID: GITHUB_CLIENT_ID,
			clientSecret: GITHUB_CLIENT_SECRET,
			// callbackURL: '/auth/github/callback',
			callbackURL: 'http://localhost:3000/auth/github/callback',
		},
		async ({ profile }) => {
			const email = profile.emails[0]?.value.trim().toLowerCase()
			if (!email) {
				throw redirectWithToast('/login', {
					title: 'Cannot connect Github Account',
					description: 'Your Github Email is Unverified',
					type: 'error',
				})
			}
			const username = profile.displayName
			const imageUrl = profile.photos[0].value
			return {
				email,
				id: profile.id,
				username,
				name: profile.name.givenName,
				imageUrl,
			}
		}
	)
)
