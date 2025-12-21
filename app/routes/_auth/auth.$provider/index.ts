import { redirect } from "react-router";
import { auth as authenticator } from "~/lib/auth/connections.server";
import { getRedirectCookieHeader } from "~/lib/redirect-cookie.server";
import { getReferrerRoute } from "~/lib/utils";
import { ProviderNameSchema } from "~/lib/validations/index.js";
import type { Route } from "./+types/index.ts";

export async function loader() {
  return redirect("/login");
}

export async function action({ request, params }: Route.ActionArgs) {
  const providerName = ProviderNameSchema.parse(params.provider);

  try {
    return await authenticator.authenticate(providerName, request);
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
