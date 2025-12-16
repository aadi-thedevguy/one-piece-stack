import { redirect } from "react-router";
import { authClient } from "~/lib/auth/auth-client";
import { getRedirectCookieHeader } from "~/lib/redirect-cookie.server";
import { getReferrerRoute } from "~/lib/utils";
import { ProviderNameSchema } from "~/lib/validations";
import type { Route } from "./+types/index";

export async function loader() {
  return redirect("/login");
}

export async function clientAction({
  request,
  params,
}: Route.ClientActionArgs) {
  const providerName = ProviderNameSchema.parse(params.provider);
  try {
    return await authClient.signIn.social({
      provider: providerName,
    });
  } catch (error: unknown) {
    if (error instanceof Response) {
      const formData = await request.formData();
      const rawRedirectTo = formData.get("redirectTo");
      const redirectTo =
        typeof rawRedirectTo === "string"
          ? rawRedirectTo
          : getReferrerRoute(request);
      const redirectToCookie = getRedirectCookieHeader(redirectTo);
      if (redirectToCookie) {
        error.headers.append("set-cookie", redirectToCookie);
      }
    }
    throw error;
  }
}
