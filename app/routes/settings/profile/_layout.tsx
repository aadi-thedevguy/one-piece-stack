import { invariantResponse } from "@epic-web/invariant";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { createId } from "@paralleldrive/cuid2";
import { Edit3 } from "lucide-react";
import { Link, Outlet, useMatches } from "react-router";
import { z } from "zod";
import { Spacer } from "~/components/layout/spacer";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db.server";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/_layout";

export const BreadcrumbHandle = z.object({ breadcrumb: z.any() });
export type BreadcrumbHandle = z.infer<typeof BreadcrumbHandle>;

export const handle: BreadcrumbHandle & SEOHandle = {
  breadcrumb: (
    <div className="flex items-center gap-2">
      <Edit3 className="h-4 w-4" />
      <span>Edit Profile</span>
    </div>
  ),
  getSitemapEntries: () => null,
};

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  invariantResponse(user, "User not found", { status: 404 });
  return {};
}

const BreadcrumbHandleMatch = z.object({
  handle: BreadcrumbHandle,
});

export default function EditUserProfile() {
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
            <Link className="text-muted-foreground" to="/profile">
              Profile
            </Link>
          </li>
          {breadcrumbs.map((breadcrumb, i, arr) => (
            <li
              className={cn("flex items-center gap-3", {
                "text-muted-foreground": i < arr.length - 1,
              })}
              key={createId()}
            >
              ▶️ {breadcrumb}
            </li>
          ))}
        </ul>
      </div>
      <Spacer size="xs" />
      <main className="mx-auto bg-muted px-6 py-8 md:container md:rounded-3xl">
        <Outlet />
      </main>
    </div>
  );
}
