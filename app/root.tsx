import {
	data,
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from 'react-router'
import React from 'react'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react'
import { getTheme, type Theme } from '~/lib/theme.server'
import { ClientHintCheck, getHints } from '~/lib/client/client-hints'
import tailwindStyleSheetUrl from './app.css?url'
import { combineHeaders, getDomainUrl, pipeHeaders } from '~/lib/utils'
import { getEnv } from '~/lib/env.server'
import { honeypot } from '~/lib/honeypot.server'
import { getToast } from '~/lib/toast.server'
import { prisma } from '~/lib/db.server'
import { getUserId, logout } from '~/lib/auth/auth.server'
import { GeneralErrorBoundary } from '~/components/layout/error-boundary'
import Footer from '~/components/layout/Footer'
import Navbar from '~/components/layout/Navbar'
import { EpicToaster } from '~/components/layout/sonner'
import { useToast } from '~/components/layout/toaster'
import { EpicProgress } from '~/components/layout/progress-bar'
import { ThemeSwitch, useTheme } from './routes/resources+/theme-switch'
import { useNonce } from '~/lib/client/nonce-provider'
import { Button } from '~/components/ui/button'
import { UserDropdown } from '~/components/layout/user-dropdown'
import { csrf } from '~/lib/csrf.server'
import type { Route } from './+types/root'

export const links: Route.LinksFunction = () => {
	return [
		{
			rel: 'icon',
			href: '/avatar1.png',
			sizes: '48x48',
		},
		{ rel: 'stylesheet', href: tailwindStyleSheetUrl },
	].filter(Boolean)
}

export const meta: Route.MetaFunction = ({ data }) => {
	return [
		{ title: data ? 'One Piece Stack' : 'Error | One Piece Stack' },
		{ name: 'description', content: '' },
		{
			property: 'og:site',
			content: '',
		},
		{
			property: 'og:url',
			content: '',
		},
		{
			property: 'og:title',
			content: '',
		},
		{
			property: 'og:description',
			content: '',
		},
		{
			property: 'og:image',
			content: '',
		},
		{
			name: 'twitter:card',
			content: 'summary_large_image',
		},
		{
			name: 'twitter:site',
			content: '',
		},
		{
			name: 'twitter:url',
			content: '',
		},
		{
			name: 'twitter:title',
			content: 'One Piece Stack',
		},
		{
			name: 'twitter:description',
			content: '',
		},
		{
			name: 'twitter:image',
			content: '',
		},
	]
}

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await getUserId(request)

	const user = userId
		? await prisma.user.findUniqueOrThrow({
				select: {
					id: true,
					name: true,
					username: true,
					image: { select: { url: true } },
					roles: {
						select: {
							name: true,
							permissions: {
								select: {
									entity: true,
									action: true,
									access: true,
								},
							},
						},
					},
				},
				where: { id: userId },
			})
		: null
	if (userId && !user) {
		console.info('something weird happened')
		// something weird happened... The user is authenticated but we can't find
		// them in the database. Maybe they were deleted? Let's log them out.
		await logout({ request, redirectTo: '/' })
	}
	const { toast, headers: toastHeaders } = await getToast(request)
	const honeyProps = honeypot.getInputProps()
	const [csrfToken, csrfCookieHeader] = await csrf.commitToken()

	return data(
		{
			user,
			requestInfo: {
				hints: getHints(request),
				origin: getDomainUrl(request),
				path: new URL(request.url).pathname,
				userPrefs: {
					theme: getTheme(request),
				},
			},
			ENV: getEnv(),
			toast,
			honeyProps,
			csrfToken,
		},
		{
			headers: combineHeaders(
				toastHeaders,
				csrfCookieHeader ? { 'set-cookie': csrfCookieHeader } : null
			),
		}
	)
}

export const headers = pipeHeaders

function Document({
	children,
	nonce,
	theme = 'light',
	env = {},
}: {
	children: React.ReactNode
	nonce: string
	theme?: Theme
	env?: Record<string, string | undefined>
	allowIndexing?: boolean
}) {
	const allowIndexing = ENV.ALLOW_INDEXING !== 'false'
	return (
		<html lang='en' className={`${theme}`}>
			<head>
				<ClientHintCheck nonce={nonce} />
				<Meta />
				<meta charSet='utf-8' />
				<meta
					name='viewport'
					content='width=device-width,initial-scale=1'
				/>
				{allowIndexing ? null : (
					<meta name='robots' content='noindex, nofollow' />
				)}
				<Links />
			</head>
			<body className='h-full max-w-screen bg-background text-foreground font-sans overflow-x-hidden'>
				{children}
				<script
					nonce={nonce}
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(env)}`,
					}}
				/>
				<ScrollRestoration nonce={nonce} />
				<Scripts nonce={nonce} />
			</body>
		</html>
	)
}

export function Layout({ children }: { children: React.ReactNode }) {
	// if there was an error running the loader, data could be missing
	const data = useLoaderData<typeof loader | null>()
	const nonce = useNonce()
	const theme = useTheme()
	return (
		<Document nonce={nonce} env={data?.ENV} theme={theme}>
			{children}
		</Document>
	)
}

function App() {
	const data = useLoaderData<typeof loader>()
	const theme = useTheme()
	useToast(data.toast)

	return (
		<>
			<div className='flex h-screen flex-col justify-between'>
				<Navbar>
					<div className='flex items-center gap-10'>
						{data.user ? (
							<UserDropdown />
						) : (
							<Button asChild variant='default' size='lg'>
								<Link to='/login'>Log In</Link>
							</Button>
						)}
					</div>
				</Navbar>

				<div className='flex-1'>
					<Outlet />
				</div>

				<Footer>
					<ThemeSwitch
						userPreference={data.requestInfo.userPrefs.theme}
					/>
				</Footer>
			</div>
			<EpicToaster
				closeButton
				position='top-center'
				theme={theme ?? 'light'}
			/>
			<EpicProgress />
		</>
	)
}

function AppWithProviders() {
	const data = useLoaderData<typeof loader>()
	return (
		<AuthenticityTokenProvider token={data.csrfToken}>
			<HoneypotProvider {...data.honeyProps}>
				<App />
			</HoneypotProvider>
		</AuthenticityTokenProvider>
	)
}
export default AppWithProviders

// this is a last resort error boundary. There's not much useful information we
// can offer at this level.
export const ErrorBoundary = GeneralErrorBoundary
