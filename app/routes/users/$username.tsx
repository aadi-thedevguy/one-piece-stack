import { invariantResponse } from "@epic-web/invariant";
import { LogOut } from "lucide-react";
import { Img } from "openimg/react";
import {
  Form,
  Link,
  type LoaderFunctionArgs,
  useLoaderData,
} from "react-router";
import { GeneralErrorBoundary } from "~/components/layout/error-boundary";
import { Spacer } from "~/components/layout/spacer";
import { Button } from "~/components/ui/button";
import { prisma } from "~/lib/db.server";
import { getUserImgSrc, useOptionalUser } from "~/lib/utils";
import type { Route } from "./+types/$username";

export async function loader({ params }: LoaderFunctionArgs) {
  const user = await prisma.user.findFirst({
    select: {
      id: true,
      name: true,
      username: true,
      createdAt: true,
      image: { select: { id: true, objectKey: true } },
    },
    where: {
      username: params.username,
    },
  });

  invariantResponse(user, "User not found", { status: 404 });

  return { user, userJoinedDisplay: user.createdAt.toLocaleDateString() };
}

export default function ProfileRoute() {
  const data = useLoaderData<typeof loader>();
  const user = data.user;
  const userDisplayName = user.name ?? user.username;
  const loggedInUser = useOptionalUser();
  const isLoggedInUser = user.id === loggedInUser?.id;

  return (
    <div className="container mt-36 mb-48 flex flex-col items-center justify-center">
      <Spacer size="4xs" />

      <div className="container flex flex-col items-center rounded-3xl bg-muted p-12">
        <div className="relative w-52">
          <div className="-top-40 absolute">
            <div className="relative">
              <Img
                alt={userDisplayName}
                className="size-52 rounded-full object-cover"
                height={832}
                src={getUserImgSrc(data.user.image?.objectKey)}
                width={832}
              />
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
          {isLoggedInUser ? (
            <Form action="/logout" className="mt-3" method="POST">
              <Button size="pill" type="submit" variant="link">
                <LogOut className="scale-125 max-md:scale-150">Logout</LogOut>
              </Button>
            </Form>
          ) : null}
          <div className="mt-10 flex gap-4">
            {isLoggedInUser ? (
              <>
                <Button asChild>
                  <Link prefetch="intent" to="notes">
                    My notes
                  </Link>
                </Button>
                <Button asChild>
                  <Link prefetch="intent" to="/settings/profile">
                    Edit profile
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link prefetch="intent" to="notes">
                  {userDisplayName}'s notes
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const meta: Route.MetaFunction = ({ data, params }) => {
  const displayName = data?.user.name ?? params.username;
  return [
    { title: `${displayName} | Epic Notes` },
    {
      name: "description",
      content: `Profile of ${displayName} on Epic Notes`,
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
