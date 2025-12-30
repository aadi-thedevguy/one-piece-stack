import { PassThrough } from "node:stream";
import { styleText } from "node:util";
import { createReadableStreamFromReadable } from "@react-router/node";
// import * as Sentry from "@sentry/react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import {
  type ActionFunctionArgs,
  type HandleDocumentRequestFunction,
  type LoaderFunctionArgs,
  ServerRouter,
} from "react-router";
import { NonceProvider } from "./lib/client/nonce-provider";
import { getEnv, init } from "./lib/env.server";

export const streamTimeout = 5000;

init();
global.ENV = getEnv();

type DocRequestArgs = Parameters<HandleDocumentRequestFunction>;

export default async function handleRequest(...args: DocRequestArgs) {
  const [
    request,
    responseStatusCode,
    responseHeaders,
    reactRouterContext,
    loadContext,
  ] = args;

  // if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
  //   responseHeaders.append("Document-Policy", "js-profiling");
  // }

  const callbackName = isbot(request.headers.get("user-agent"))
    ? "onAllReady"
    : "onShellReady";

  // const nonce = crypto.randomBytes(16).toString("hex");
  const nonce = loadContext.cspNonce?.toString() ?? "";

  return new Promise((resolve, reject) => {
    let didError = false;

    const { pipe, abort } = renderToPipeableStream(
      <NonceProvider value={nonce}>
        <ServerRouter
          context={reactRouterContext}
          nonce={nonce}
          url={request.url}
        />
      </NonceProvider>,
      {
        [callbackName]: () => {
          const body = new PassThrough();
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(createReadableStreamFromReadable(body), {
              headers: responseHeaders,
              status: didError ? 500 : responseStatusCode,
            })
          );
          pipe(body);
        },
        onShellError: (err: unknown) => {
          reject(err);
        },
        onError: () => {
          didError = true;
        },
        nonce,
      }
    );

    setTimeout(abort, streamTimeout + 5000);
  });
}

export function handleError(
  error: unknown,
  { request }: LoaderFunctionArgs | ActionFunctionArgs
): void {
  // Skip capturing if the request is aborted as Remix docs suggest
  // Ref: https://remix.run/docs/en/main/file-conventions/entry.server#handleerror
  if (request.signal.aborted) {
    return;
  }
  if (error instanceof Error) {
    console.error(styleText("red", String(error.stack)));
  } else {
    console.error(error);
  }
  // Sentry.captureException(error);
}
