import { type MiddlewareFunction, redirect } from "react-router";
import { userContext } from "~/context";
import { auth } from "./lib/auth/auth.server";

export const requireUserMiddleware: MiddlewareFunction = async ({
  request,
  context,
}) => {
  console.log("\n\n\n user middleware ran on route: ");
  console.log(new URL(request.url).pathname);
  console.log("\n\n\n");
  const session = await auth.api.getSession(request);
  if (!session?.session || session.session.expiresAt < new Date()) {
    throw redirect(
      `/login?redirectTo=${encodeURIComponent(new URL(request.url).pathname)}`
    );
  }

  // context.set(userIdContext, session.user.id);
  context.set(userContext, session.user);
};

export const requireAnonymousMiddleware: MiddlewareFunction = async ({
  request,
}) => {
  console.log("\n\n\n anonymous middleware ran on route: ");
  console.log(new URL(request.url).pathname);
  console.log("\n\n\n");
  const session = await auth.api.getSession(request);
  if (session?.session) throw redirect("/");
};
