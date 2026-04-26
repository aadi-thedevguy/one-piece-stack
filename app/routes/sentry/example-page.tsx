import * as Sentry from "@sentry/react-router";
import { useEffect, useState } from "react";
import { requireUserWithRole } from "~/lib/auth/auth.server";
import type { Route } from "./+types/example-page";

class SentryExampleFrontendError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleFrontendError";
  }
}

export const meta = () => [{ title: "sentry-example-page" }];

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserWithRole(request, "admin");
}

export default function ExamplePage() {
  const [hasSentError, setHasSentError] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    async function checkConnectivity() {
      const result = await Sentry.diagnoseSdkConnectivity();
      setIsConnected(result !== "sentry-unreachable");
    }
    checkConnectivity();
  }, []);

  return (
    <div>
      <main>
        <div className="flex-spacer" />
        <h1>sentry-example-page</h1>
        <button
          disabled={!isConnected}
          onClick={async () => {
            await Sentry.startSpan(
              {
                name: "Example Frontend Span",
                op: "test",
              },
              async () => {
                const res = await fetch("/sentry/api/sentry-example-api");
                if (!res.ok) {
                  setHasSentError(true);
                }
              }
            );
            throw new SentryExampleFrontendError(
              "This error is raised on the frontend of the example page."
            );
          }}
          type="button"
        >
          <span>Throw Sample Error</span>
        </button>

        {hasSentError ? (
          <p className="success">Sample error was sent to Sentry.</p>
        ) : isConnected ? (
          <div className="success_placeholder" />
        ) : (
          <div className="connectivity-error">
            <p>
              It looks like network requests to Sentry are being blocked, which
              will prevent errors from being captured. Try disabling your
              ad-blocker to complete the test.
            </p>
          </div>
        )}

        <div className="flex-spacer" />
      </main>

      {/* Not for production use! We're just saving you from having to delete an extra CSS file ;) */}
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: This is a safe internal style block */}
      <style dangerouslySetInnerHTML={{ __html: styles }} />
    </div>
  );
}

const styles = `
  main {
    display: flex;
    min-height: 100vh;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 16px;
    padding: 16px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  }

  h1 {
    padding: 0px 4px;
    border-radius: 4px;
    background-color: rgba(24, 20, 35, 0.03);
    font-family: monospace;
    font-size: 20px;
    line-height: 1.2;
  }

  p {
    margin: 0;
    font-size: 20px;
  }

  a {
    color: #6341F0;
    text-decoration: underline;
    cursor: pointer;

    @media (prefers-color-scheme: dark) {
      color: #B3A1FF;
    }
  }

  button {
    border-radius: 8px;
    color: white;
    cursor: pointer;
    background-color: #553DB8;
    border: none;
    padding: 0;
    margin-top: 4px;

    & > span {
      display: inline-block;
      padding: 12px 16px;
      border-radius: inherit;
      font-size: 20px;
      font-weight: bold;
      line-height: 1;
      background-color: #7553FF;
      border: 1px solid #553DB8;
      transform: translateY(-4px);
    }

    &:hover > span {
      transform: translateY(-8px);
    }

    &:active > span {
      transform: translateY(0);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;

      & > span {
        transform: translateY(0);
        border: none;
      }
    }
  }

  .description {
    text-align: center;
    color: #6E6C75;
    max-width: 500px;
    line-height: 1.5;
    font-size: 20px;

    @media (prefers-color-scheme: dark) {
      color: #A49FB5;
    }
  }

  .flex-spacer {
    flex: 1;
  }

  .success {
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 20px;
    line-height: 1;
    background-color: #00F261;
    border: 1px solid #00BF4D;
    color: #181423;
  }

  .success_placeholder {
    height: 46px;
  }

  .connectivity-error {
    padding: 12px 16px;
    background-color: #E50045;
    border-radius: 8px;
    width: 500px;
    color: #FFFFFF;
    border: 1px solid #A80033;
    text-align: center;
    margin: 0;
  }

  .connectivity-error a {
    color: #FFFFFF;
    text-decoration: underline;
  }
`;
