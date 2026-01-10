import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import * as Sentry from "@sentry/react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { type HandleDocumentRequestFunction, ServerRouter } from "react-router";
import { serverBuildContext } from "server";
import { NonceProvider } from "./lib/client/nonce-provider";
import { getEnv, init } from "./lib/env.server";

export const streamTimeout = 5000;

init();
global.ENV = getEnv();

type DocRequestArgs = Parameters<HandleDocumentRequestFunction>;

async function handleRequest(...args: DocRequestArgs) {
  const [
    request,
    responseStatusCode,
    responseHeaders,
    reactRouterContext,
    loadContext,
  ] = args;

  if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
    responseHeaders.append("Document-Policy", "js-profiling");
  }

  const callbackName = isbot(request.headers.get("user-agent"))
    ? "onAllReady"
    : "onShellReady";

  const context = loadContext.get(serverBuildContext);
  const nonce = context?.nonce as string;

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
          pipe(Sentry.getMetaTagTransformer(body));
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

export const handleError = Sentry.createSentryHandleError({ logErrors: true });

export default Sentry.wrapSentryHandleRequest(handleRequest);
