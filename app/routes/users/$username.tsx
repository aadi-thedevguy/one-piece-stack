import { invariantResponse } from "@epic-web/invariant";
import { LogOut } from "lucide-react";
import { Img } from "openimg/react";
import {
  data,
  Form,
  Link,
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
} from "react-router";
import { GeneralErrorBoundary } from "~/components/layout/error-boundary";
import { Button } from "~/components/ui/button";
import { placeholderAvatar } from "~/constants/keys";
import { auth } from "~/lib/auth/auth.server";
import { useOptionalUser } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  invariantResponse(session?.user, "User not found", { status: 404 });

  return data({
    user: session.user,
    userJoinedDisplay: session.user.createdAt.toLocaleDateString(),
  });
}

export default function ProfileRoute() {
  const data = useLoaderData<typeof loader>();
  const user = data.user;
  const userDisplayName = user.name ?? user.username;
  const loggedInUser = useOptionalUser();
  const isLoggedInUser = data.user.id === loggedInUser?.id;

  return (
    <div className="container mt-36 mb-48 flex flex-col items-center justify-center">
      <div className="container flex flex-col items-center rounded-3xl bg-muted p-12">
        <div className="relative w-52">
          <div className="-top-40 absolute">
            <div className="relative">
              <Img
                alt={userDisplayName}
                className="h-52 w-52 rounded-full object-cover"
                height={200}
                src={data.user.image || placeholderAvatar}
                width={200}
              />
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <h1 className="text-center text-h2">{userDisplayName}</h1>
          </div>
          <p className="mt-2 text-center text-muted-foreground">
            Joined {data.userJoinedDisplay}
          </p>
          {isLoggedInUser ? (
            <Form action="/logout" className="mt-3" method="POST">
              <Button size="icon" type="submit" variant="link">
                <LogOut className="scale-125 max-md:scale-150">Logout</LogOut>
              </Button>
            </Form>
          ) : null}
          <div className="mt-10 flex gap-4">
            {isLoggedInUser ? (
              <Button asChild>
                <Link prefetch="intent" to="/settings/profile">
                  Edit profile
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link prefetch="intent" to="notes">
                  {userDisplayName}&apos;s notes
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
  const displayName = data?.user.name ?? params.username;
  return [
    { title: `${displayName} | One Piece Stack` },
    {
      name: "description",
      content: `Profile of ${displayName} on One Piece Stack`,
    },
  ];
};

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        404: ({ params }) => (
          <p>No user with the username &quot;{params.username}&quot; exists</p>
        ),
      }}
    />
  );
}
