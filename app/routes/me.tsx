import { type LoaderFunctionArgs, redirect } from "react-router";
import { logout, requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const requestUrl = new URL(request.url);
    const loginParams = new URLSearchParams([
      ["redirectTo", `${requestUrl.pathname}${requestUrl.search}`],
    ]);
    const redirectTo = `/login?${loginParams}`;
    await logout({ request, redirectTo });
    return redirect(redirectTo);
  }
  return redirect("/profile");
}
