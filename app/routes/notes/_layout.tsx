import { invariantResponse } from "@epic-web/invariant";
import { Plus } from "lucide-react";
import { Img } from "openimg/react";
import { data, Link, NavLink, Outlet } from "react-router";
import { GeneralErrorBoundary } from "~/components/layout/error-boundary";
import { adminPlaceholderAvatar } from "~/constants/keys.js";
import { userIdContext } from "~/context.js";
import { cache, cachified } from "~/lib/cache.server";
import { prisma } from "~/lib/db.server";
import { makeTimings } from "~/lib/timing.server";
import { cn, getUserImgSrc, useOptionalUser } from "~/lib/utils";
import { requireUserMiddleware } from "~/middleware.server.js";
import type { Route } from "./+types/_layout.ts";

export const middleware = [requireUserMiddleware];

export async function loader({ context }: Route.LoaderArgs) {
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });

  const timings = makeTimings("notes-layoutLoader");

  const owner = await cachified({
    key: `user-notes:${userId}`,
    cache,
    timings,
    getFreshValue: () => {
      console.log(
        `[CACHE MISS] Fetching fresh notes list for user ${userId} from DB`
      );
      return prisma.user.findFirst({
        select: {
          id: true,
          name: true,
          username: true,
          image: { select: { objectKey: true } },
          notes: { select: { id: true, title: true } },
          roles: { select: { name: true } },
        },
        where: { id: userId },
      });
    },
    ttl: 1000 * 60 * 60 * 24 * 30, // 30 days
    staleWhileRevalidate: 1000 * 60 * 60 * 24 * 30, // 30 days
  });

  invariantResponse(owner, "Owner not found", { status: 404 });

  const isAdmin = owner.roles.some(({ name }) => name === "admin");

  return data(
    { owner, isAdmin },
    { headers: { "Server-Timing": timings.toString() } }
  );
}

export default function NotesRoute({ loaderData }: Route.ComponentProps) {
  const user = useOptionalUser();
  const isOwner = user?.id === loaderData.owner.id;
  const ownerDisplayName = loaderData.owner.name ?? loaderData.owner.username;
  const navLinkDefaultClassName =
    "line-clamp-2 flex items-center gap-2 rounded-l-full py-2 pl-8 pr-6 text-base lg:text-xl";
  return (
    <main className="container flex min-h-100 flex-1 px-0 pb-12 md:px-8">
      <div className="grid w-full grid-cols-4 bg-muted pl-2 md:container md:rounded-3xl md:pr-0">
        <div className="relative col-span-1">
          <div className="absolute inset-0 flex flex-col">
            <Link
              className="flex flex-col items-center justify-center gap-2 bg-muted pt-12 pr-4 pb-4 pl-8 xl:flex-row xl:justify-start xl:gap-4"
              to="/notes"
            >
              {loaderData.isAdmin && !loaderData.owner.image ? (
                <img
                  alt={ownerDisplayName}
                  className="size-16 rounded-full object-cover xl:size-24"
                  height={256}
                  src={adminPlaceholderAvatar}
                  width={256}
                />
              ) : (
                <Img
                  alt={ownerDisplayName}
                  className="size-16 rounded-full object-cover xl:size-24"
                  height={256}
                  src={getUserImgSrc(loaderData.owner.image?.objectKey)}
                  width={256}
                />
              )}
              <h1 className="text-center font-bold text-base md:text-lg lg:text-left lg:text-2xl">
                {ownerDisplayName}'s Notes
              </h1>
            </Link>
            <ul className="overflow-y-auto overflow-x-hidden pb-12">
              {isOwner ? (
                <li className="p-1 pr-0">
                  <NavLink
                    className={({ isActive }) =>
                      cn(navLinkDefaultClassName, isActive && "bg-accent")
                    }
                    to="new"
                  >
                    <span>New Note</span>
                    <Plus className="h-4 w-4" />
                  </NavLink>
                </li>
              ) : null}
              {loaderData.owner.notes.map((note) => (
                <li className="p-1 pr-0" key={note.id}>
                  <NavLink
                    className={({ isActive }) =>
                      cn(navLinkDefaultClassName, isActive && "bg-accent")
                    }
                    prefetch="intent"
                    preventScrollReset
                    to={note.id}
                  >
                    {note.title}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="relative col-span-3 bg-accent md:rounded-r-3xl">
          <Outlet />
        </div>
      </div>
    </main>
  );
}

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        404: () => <p>No such user exists</p>,
      }}
    />
  );
}
