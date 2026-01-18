import { type LoaderFunctionArgs, redirect } from "react-router";
import { userIdContext } from "~/context";
import { logout } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db.server";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const userId = context.get(userIdContext) as string;
  if (!userId) return redirect("/login");

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
  return redirect("/my-profile");
}
