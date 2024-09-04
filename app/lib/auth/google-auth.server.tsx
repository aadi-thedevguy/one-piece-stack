import { GoogleStrategy } from 'remix-auth-google'
import { Authenticator } from 'remix-auth'
import { ProviderUser } from '~/types'
import { createCookieSessionStorage } from '@remix-run/node'


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
				throw new Error('Email not found')
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
