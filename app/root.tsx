import React from 'react'
import type {
  LinksFunction,
  LoaderFunction,
  MetaFunction,
  SerializeFrom,
} from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'
import { withSentry } from '@sentry/remix'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react'
import { getTheme, Theme } from './lib/theme.server'
import { ClientHintCheck, getHints } from './lib/client/client-hints'
import '~/tailwind.css'
import { combineHeaders, getDomainUrl } from './lib/utils'
import { getEnv } from './lib/env.server'
import { honeypot } from './lib/honeypot.server'
import { getToast } from './lib/toast.server'
import { prisma } from './lib/db.server'
import { getUserId, logout } from './lib/auth/auth.server'
import { GeneralErrorBoundary } from './components/layout/error-boundary'
import { EpicToaster } from './components/layout/sonner'
import { useToast } from './components/layout/toaster'
import { EpicProgress } from './components/layout/progress-bar'
// import Navbar from './components/layout/Navbar'
// import Footer from './components/layout/Footer'
import { ThemeSwitch, useTheme } from './routes/resources+/theme-switch'
import { useNonce } from './lib/client/nonce-provider'
import { Button } from './components/ui/button'
import { UserDropdown } from './components/layout/user-dropdown'
import Footer from './components/layout/Footer'
import Navbar from './components/layout/Navbar'
import { csrf } from './lib/csrf.server'

export const links: LinksFunction = () => {
  return [
    // {
    // 	rel: 'icon',
    // 	href: '/favicon.ico',
    // 	sizes: '48x48',
    // },
    // { rel: 'icon', type: 'image/svg+xml', href: faviconAssetUrl },
    // { rel: 'apple-touch-icon', href: appleTouchIconAssetUrl },
    // {
    // 	rel: 'manifest',
    // 	href: '/site.webmanifest',
    // 	crossOrigin: 'use-credentials',
    // } as const, // necessary to make typescript happy
    // { rel: 'stylesheet', href: styles },
    // { rel: 'stylesheet', href: nProgressStyles },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&family=Orbitron:wght@700&display=swap',
    },
  ].filter(Boolean)
}

// TODO: fill out the empty strings as required
export const meta: MetaFunction = () => [
  {
    charSet: 'utf-8',
  },
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
    title: 'Remix Saas Stack',
  },
  {
    name: 'description',
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
    content: 'Remix Saas Stack',
  },
  {
    name: 'twitter:description',
    content: '',
  },
  {
    name: 'twitter:image',
    content: '',
  },
  {
    name: 'viewport',
    content: 'width=device-width,initial-scale=1',
  },
]

export type LoaderData = SerializeFrom<typeof loader>

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request)
  const themeSession = getTheme(request)

  const user = userId
    ? await
      prisma.user.findUniqueOrThrow({
        select: {
          id: true,
          name: true,
          username: true,
          image: { select: { url: true } },
          roles: {
            select: {
              name: true,
              permissions: {
                select: { entity: true, action: true, access: true },
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

  return json(
    {
      user,
      requestInfo: {
        origin: getDomainUrl(request),
        path: new URL(request.url).pathname,
        userPrefs: {
          theme: themeSession,
        },
        hints: getHints(request),
      },
      ENV: getEnv(),
      toast,
      honeyProps,
      csrfToken
    },
    {
      headers: combineHeaders(
        toastHeaders,
        csrfCookieHeader ? { 'set-cookie': csrfCookieHeader } : null,
      ),
    },
  )
}

const Document = ({
  children,
  theme = "light",
  nonce,
  allowIndexing = true,
}: {
  children: React.ReactNode
  theme?: Theme
  nonce: string
  allowIndexing?: boolean
}) => {

  return (
    <html lang='en' className={`${theme}`}>
      <head>
        <ClientHintCheck nonce={nonce} />
        <Meta />
        <Links />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {allowIndexing ? null : (
          <meta name="robots" content="noindex, nofollow" />
        )}
      </head>
      <body className='h-full max-w-screen bg-background text-foreground font-sans overflow-x-hidden'>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  )
}

function App() {
  const data = useLoaderData<LoaderData>()
  const allowIndexing = data.ENV.ALLOW_INDEXING !== 'false'
  const theme = useTheme()
  const nonce = useNonce()
  useToast(data.toast)

  return (
    <Document
      theme={theme}
      nonce={nonce}
      allowIndexing={allowIndexing}
    >
      <div className="flex h-screen flex-col justify-between">
        <Navbar>
          <div className="flex items-center gap-10">
            {data.user ? (
              <UserDropdown />
            ) : (
              <Button asChild variant="default" size="lg">
                <Link to="/login">Log In</Link>
              </Button>
            )}
          </div>
        </Navbar>

        <div className="flex-1">
          <Outlet />
        </div>

        <Footer>
          <ThemeSwitch userPreference={data.requestInfo.userPrefs.theme} />
        </Footer>
      </div>
      <EpicToaster closeButton position="top-center" theme={theme ?? "light"} />
      <EpicProgress />
    </Document >
  )
}


function AppWithProviders() {
  const data = useLoaderData<LoaderData>()

  return (
    <AuthenticityTokenProvider token={data.csrfToken}>
      <HoneypotProvider {...data.honeyProps}>
        <App />
      </HoneypotProvider>
    </AuthenticityTokenProvider>

  )
}

export default withSentry(AppWithProviders)

export function ErrorBoundary() {

  // NOTE: you cannot use useLoaderData in an ErrorBoundary because the loader
  // likely failed to run so we have to do the best we can.
  // We could probably do better than this (it's possible the loader did run).
  // This would require a change in Remix.

  // Just make sure your root route never errors out and you'll always be able
  // to give the user a better UX.

  return (
    <Document nonce=''>
      <GeneralErrorBoundary />
    </Document>
  )
}
