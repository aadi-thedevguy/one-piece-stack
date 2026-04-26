import { invariantResponse } from "@epic-web/invariant";
import { LayoutDashboard, LogOut, XCircle } from "lucide-react";
import { Img } from "openimg/react";
import {
  Form,
  Link,
  type LoaderFunctionArgs,
  useFetcher,
  useLoaderData,
} from "react-router";
import { GeneralErrorBoundary } from "~/components/layout/error-boundary";
import { Spacer } from "~/components/layout/spacer";
import { Button } from "~/components/ui/button";
import { adminPlaceholderAvatar } from "~/constants/keys";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db.server";
import { getUserImgSrc, useDoubleCheck } from "~/lib/utils";
import type { Route } from "./+types/my-profile";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      name: true,
      createdAt: true,
      id: true,
      image: true,
      roles: { select: { name: true } },
      subscription: {
        include: {
          plan: true,
          price: true,
        },
      },
    },
  });
  invariantResponse(user, "User not found", { status: 404 });

  return {
    user,
    userJoinedDisplay: user.createdAt.toLocaleDateString(),
    subscription: user.subscription,
  };
}

export default function ProfileRoute() {
  const data = useLoaderData<typeof loader>();
  const user = data.user;
  const userDisplayName = user.name ?? user.username;
  const isAdmin = user.roles.some((role) => role.name === "admin");
  const fetcher = useFetcher();
  const dc = useDoubleCheck();

  return (
    <div className="container mt-36 mb-48 flex flex-col items-center justify-center">
      <Spacer size="4xs" />

      <div className="container flex flex-col items-center rounded-3xl bg-muted p-12">
        <div className="relative w-52">
          <div className="absolute -top-40">
            <div className="relative">
              {isAdmin && !user.image ? (
                <img
                  alt={userDisplayName}
                  className="size-52 rounded-full object-cover"
                  height={832}
                  src={adminPlaceholderAvatar}
                  width={832}
                />
              ) : (
                <Img
                  alt={userDisplayName}
                  className="size-52 rounded-full object-cover"
                  height={832}
                  src={getUserImgSrc(data.user.image?.objectKey)}
                  width={832}
                />
              )}
            </div>
          </div>
        </div>

        <Spacer size="sm" />

        <div className="flex flex-col items-center">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <h1 className="text-center text-h2">{userDisplayName}</h1>
          </div>
          <p className="mt-2 text-center text-muted-foreground">
            Joined {data.userJoinedDisplay}
          </p>
          <Form action="/logout" className="mt-3" method="POST">
            <Button size="pill" type="submit" variant="link">
              <LogOut className="scale-125 max-md:scale-150">Logout</LogOut>
            </Button>
          </Form>
          <div className="mt-10 flex gap-4">
            {isAdmin && (
              <Button asChild>
                <Link className="flex items-center gap-1" to="/admin/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              </Button>
            )}

            <Button asChild>
              <Link prefetch="intent" to="/notes">
                Notes
              </Link>
            </Button>
            <Button asChild>
              <Link prefetch="intent" to="/settings/profile">
                Edit profile
              </Link>
            </Button>
          </div>

          <div className="mt-8 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
              <div className="flex items-center gap-4">
                {data.subscription ? (
                  <div className="grid gap-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        {data.subscription.plan.name}
                      </h3>
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-primary text-xs">
                        {data.subscription.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {data.subscription.plan.description}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {data.subscription.cancelAtPeriodEnd
                        ? `Cancels on ${new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}`
                        : `Renews on ${new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}`}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {(data.subscription.price.amount / 100).toLocaleString(
                        "en-US",
                        {
                          style: "currency",
                          currency: data.subscription.price.currency,
                        }
                      )}{" "}
                      / {data.subscription.price.interval}
                    </p>
                  </div>
                ) : (
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">
                      No active subscription
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      You are currently on the free plan.
                    </p>
                  </div>
                )}
              </div>
              <div className="ml-4 flex flex-col gap-2 sm:flex-row">
                <Button asChild size="sm">
                  <Link to={`/plans?redirectTo=users/${user.username}`}>
                    {data.subscription ? "Manage" : "Upgrade"}
                  </Link>
                </Button>
                {data.subscription?.status === "active" && (
                  <fetcher.Form
                    action="/resources/subscription/cancel"
                    method="POST"
                  >
                    <input name="userId" type="hidden" value={user.id} />
                    <Button
                      size="sm"
                      variant={dc.doubleCheck ? "destructive" : "secondary"}
                      {...dc.getButtonProps({ type: "submit" })}
                    >
                      {dc.doubleCheck ? "Are you sure?" : "Cancel"}
                      <XCircle className="ml-1 h-4 w-4" />
                    </Button>
                  </fetcher.Form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const displayName = loaderData?.user.name;
  return [
    { title: `${displayName} | One Piece App` },
    {
      name: "description",
      content: `Profile of ${displayName} on One Piece App`,
    },
  ];
};

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        404: ({ params }) => (
          <p>No user with the username "{params.username}" exists</p>
        ),
      }}
    />
  );
}
