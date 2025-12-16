import { invariantResponse } from "@epic-web/invariant";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { Edit3 } from "lucide-react";
import { data, Link, Outlet, useMatches } from "react-router";
import { z } from "zod";
import { userContext } from "~/context";
import { authClient } from "~/lib/auth/auth-client";
import { cn } from "~/lib/utils";
import { BreadcrumbHandle } from "~/lib/validations";
import { requireUserMiddleware } from "~/middleware.server";
import type { Route } from "./+types/_layout";

export const handle: BreadcrumbHandle & SEOHandle = {
  breadcrumb: (
    <div className="flex items-center gap-2">
      <Edit3 className="h-4 w-4" />
      <span>Edit Profile</span>
    </div>
  ),
  getSitemapEntries: () => null,
};

export const middleware = [requireUserMiddleware];

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userContext);
  invariantResponse(user, "User not found", { status: 404 });
  return data({});
}

const BreadcrumbHandleMatch = z.object({
  handle: BreadcrumbHandle,
});

export default function EditUserProfile() {
  const session = authClient.useSession();
  const matches = useMatches();
  const breadcrumbs = matches
    .map((m) => {
      const result = BreadcrumbHandleMatch.safeParse(m);
      if (!(result.success && result.data.handle.breadcrumb)) return null;
      return (
        <Link className="flex items-center" key={m.id} to={m.pathname}>
          {result.data.handle.breadcrumb}
        </Link>
      );
    })
    .filter(Boolean);

  return (
    <div className="m-auto mt-16 mb-24 max-w-3xl">
      <div className="container">
        <ul className="flex gap-3">
          <li>
            <Link
              className="text-muted-foreground"
              to={`/users/${session?.data?.user.username}`}
            >
              Profile
            </Link>
          </li>
          {breadcrumbs.map((breadcrumb, i, arr) => (
            <li
              className={cn("flex items-center gap-3", {
                "text-muted-foreground": i < arr.length - 1,
              })}
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              key={i}
            >
              ▶️ {breadcrumb}
            </li>
          ))}
        </ul>
      </div>
      <main className="mx-auto bg-muted px-6 py-8 md:container md:rounded-3xl">
        <Outlet />
      </main>
    </div>
  );
}
