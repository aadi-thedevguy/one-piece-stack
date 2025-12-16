/** biome-ignore-all lint/correctness/noUndeclaredVariables: <explanation> */
/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: <explanation> */

import { OpenImgContextProvider } from "openimg/react";
import type React from "react";
import {
  data,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import { AuthenticityTokenProvider } from "remix-utils/csrf/react";
import { HoneypotProvider } from "remix-utils/honeypot/react";
import { GeneralErrorBoundary } from "~/components/layout/error-boundary";
import Footer from "~/components/layout/Footer";
import Navbar from "~/components/layout/Navbar";
import { EpicProgress } from "~/components/layout/progress-bar";
import { EpicToaster } from "~/components/layout/sonner";
import { useToast } from "~/components/layout/toaster";
import { UserDropdown } from "~/components/layout/user-dropdown";
import { Button } from "~/components/ui/button";
import { auth } from "~/lib/auth/auth.server";
import { ClientHintCheck, getHints } from "~/lib/client/client-hints";
import { useNonce } from "~/lib/client/nonce-provider";
import { csrf } from "~/lib/csrf.server";
import { getEnv } from "~/lib/env.server";
import { honeypot } from "~/lib/honeypot.server";
import { getTheme, type Theme } from "~/lib/theme.server";
import { getToast } from "~/lib/toast.server";
import {
  combineHeaders,
  getDomainUrl,
  getImgSrc,
  pipeHeaders,
} from "~/lib/utils";
import type { Route } from "./+types/root";
import tailwindStyleSheetUrl from "./app.css?url";
import { ThemeSwitch, useTheme } from "./routes/resources/theme-switch";

export const links: Route.LinksFunction = () =>
  [
    {
      rel: "icon",
      href: "/avatar1.png",
      sizes: "48x48",
    },
    { rel: "stylesheet", href: tailwindStyleSheetUrl },
  ].filter(Boolean);

export const meta: Route.MetaFunction = () => [
  { title: "One Piece Stack" },
  { name: "description", content: "" },
  {
    property: "og:site",
    content: "",
  },
  {
    property: "og:url",
    content: "",
  },
  {
    property: "og:title",
    content: "",
  },
  {
    property: "og:description",
    content: "",
  },
  {
    property: "og:image",
    content: "",
  },
  {
    name: "twitter:card",
    content: "summary_large_image",
  },
  {
    name: "twitter:site",
    content: "",
  },
  {
    name: "twitter:url",
    content: "",
  },
  {
    name: "twitter:title",
    content: "One Piece Stack",
  },
  {
    name: "twitter:description",
    content: "",
  },
  {
    name: "twitter:image",
    content: "",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession(request);
  const user = session?.user;
  if (!user) {
    console.info("something weird happened");
    // something weird happened... The user is authenticated but we can't find
    // them in the database. Maybe they were deleted? Let's log them out.
    await auth.api.signOut({
      headers: request.headers,
    });
  }
  const { toast, headers: toastHeaders } = await getToast(request);
  const honeyProps = honeypot.getInputProps();
  const [csrfToken, csrfCookieHeader] = await csrf.commitToken();

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
        csrfCookieHeader ? { "set-cookie": csrfCookieHeader } : null
      ),
    }
  );
}

export const headers = pipeHeaders;

function Document({
  children,
  nonce,
  theme = "light",
  env = {},
}: {
  children: React.ReactNode;
  nonce: string;
  theme?: Theme;
  env?: Record<string, string | undefined>;
  allowIndexing?: boolean;
}) {
  const allowIndexing = ENV.ALLOW_INDEXING !== "false";
  return (
    <html className={`${theme}`} lang="en">
      <head>
        <ClientHintCheck nonce={nonce} />
        <Meta />
        <meta charSet="utf-8" />
        <meta content="width=device-width,initial-scale=1" name="viewport" />
        {allowIndexing ? null : (
          <meta content="noindex, nofollow" name="robots" />
        )}
        <Links />
      </head>
      <body className="h-full max-w-screen overflow-x-hidden bg-background font-sans text-foreground">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
          nonce={nonce}
        />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  // if there was an error running the loader, data could be missing
  const layoutData = useLoaderData<typeof loader | null>();
  const nonce = useNonce();
  const theme = useTheme();
  return (
    <Document env={layoutData?.ENV} nonce={nonce} theme={theme}>
      {children}
    </Document>
  );
}

function App() {
  const loaderData = useLoaderData<typeof loader>();
  const theme = useTheme();
  useToast(loaderData.toast);

  return (
    <OpenImgContextProvider
      getSrc={getImgSrc}
      optimizerEndpoint="/resources/images"
    >
      <div className="flex h-screen flex-col justify-between">
        <Navbar>
          <div className="flex items-center gap-10">
            {loaderData.user ? (
              <UserDropdown />
            ) : (
              <Button asChild size="lg" variant="default">
                <Link to="/login">Log In</Link>
              </Button>
            )}
          </div>
        </Navbar>

        <div className="flex-1">
          <Outlet />
        </div>

        <Footer>
          <ThemeSwitch
            userPreference={loaderData.requestInfo.userPrefs.theme}
          />
        </Footer>
      </div>
      <EpicToaster closeButton position="top-center" theme={theme ?? "light"} />
      <EpicProgress />
    </OpenImgContextProvider>
  );
}

function AppWithProviders() {
  const providerData = useLoaderData<typeof loader>();
  return (
    <AuthenticityTokenProvider token={providerData.csrfToken}>
      <HoneypotProvider {...providerData.honeyProps}>
        <App />
      </HoneypotProvider>
    </AuthenticityTokenProvider>
  );
}
export default AppWithProviders;

// this is a last resort error boundary. There's not much useful information we
// can offer at this level.
export const ErrorBoundary = GeneralErrorBoundary;
