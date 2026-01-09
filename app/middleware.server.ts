import { type MiddlewareFunction, redirect } from "react-router";
import { userIdContext } from "~/context";
import { authSessionStorage } from "~/lib/auth/session.server";
import { prisma } from "~/lib/db.server";

export const requireUserMiddleware: MiddlewareFunction = async ({
  request,
  context,
}) => {
  console.log("User middleware triggered...🙋‍♂️🙋‍♂️");
  const cookie = request.headers.get("cookie");
  const session = await authSessionStorage.getSession(cookie);
  const sessionId = session.get("sessionId") as string | undefined;
  if (!sessionId)
    throw redirect(
      `/login?redirectTo=${encodeURIComponent(new URL(request.url).pathname)}`
    );

  const sessionRecord = await prisma.session.findUnique({
    select: { userId: true, expirationDate: true },
    where: { id: sessionId },
  });

  if (!sessionRecord || sessionRecord.expirationDate < new Date()) {
    throw redirect(
      `/login?redirectTo=${encodeURIComponent(new URL(request.url).pathname)}`
    );
  }

  context.set(userIdContext, sessionRecord.userId);
};

export const requireAnonymousMiddleware: MiddlewareFunction = async ({
  request,
}) => {
  console.log("Anonymous Middleware triggered...🥷🥷");
  const cookie = request.headers.get("cookie");
  const session = await authSessionStorage.getSession(cookie);
  const sessionId = session.get("sessionId") as string | undefined;
  if (sessionId) throw redirect("/");
};
