import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { invariantResponse } from "@epic-web/invariant";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import {
  Camera,
  EyeOffIcon,
  Link2Icon,
  TrashIcon,
  User2Icon,
} from "lucide-react";
import { Img } from "openimg/react";
import { data, Link, useFetcher, useLoaderData } from "react-router";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { z } from "zod";
import { ErrorList, Field } from "~/components/layout/forms";
import { StatusButton } from "~/components/layout/status-button";
import { Button } from "~/components/ui/button";
import { placeholderAvatar } from "~/constants/keys";
import { userContext } from "~/context";
import { auth } from "~/lib/auth/auth.server";
// import { authClient } from "~/lib/auth/auth-client";
import { validateCSRF } from "~/lib/csrf.server";
import { prisma } from "~/lib/db.server";
import { redirectWithToast } from "~/lib/toast.server";
import { useDoubleCheck } from "~/lib/utils";
import { ProfileFormSchema } from "~/lib/validations/user-validation";
import type { Route } from "./+types/index";

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};

export async function loader({ request, context }: Route.LoaderArgs) {
  const sessions = await auth.api.listSessions({
    headers: request.headers,
  });
  const user = context.get(userContext);
  const userId = user?.id as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });

  return data({
    user,
    otherSessionsCount: sessions.length - 1,
  });
}

type ProfileActionArgs = {
  request: Request;
  userId: string;
  formData: FormData;
};

const profileUpdateActionIntent = "update-profile";
const signOutOfSessionsActionIntent = "sign-out-of-sessions";
const deleteDataActionIntent = "delete-data";

// export async function clientAction({ request }: ClientActionFunctionArgs) {
//   const formData = await request.formData();
//   await validateCSRF(formData, request.headers);
//   const intent = formData.get("intent");
//   if (intent === signOutOfSessionsActionIntent) {
//     await authClient.revokeOtherSessions();
//   }
// }

export async function action({ request }: Route.ActionArgs) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  const userId = session?.user.id as string;
  const token = session?.session.token as string;
  const formData = await request.formData();
  await validateCSRF(formData, request.headers);
  const intent = formData.get("intent");
  switch (intent) {
    case profileUpdateActionIntent: {
      return profileUpdateAction({ request, userId, formData });
    }
    case signOutOfSessionsActionIntent: {
      return signOutOfSessionsAction({ request });
    }
    case deleteDataActionIntent: {
      return deleteDataAction({ request, token });
    }
    default: {
      throw new Response(`Invalid intent "${intent}"`, { status: 400 });
    }
  }
}

export default function EditUserProfile() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-12">
      <div className="flex justify-center">
        <div className="relative h-52 w-52">
          <Img
            alt={data.user?.username}
            className="h-full w-full rounded-full object-cover"
            height={200}
            src={data.user?.image || placeholderAvatar}
            width={200}
          />
          <Button
            asChild
            className="-right-3 absolute top-3 flex h-10 w-10 items-center justify-center rounded-full p-0"
            variant="outline"
          >
            <Link
              aria-label="Change profile photo"
              preventScrollReset
              title="Change profile photo"
              to="photo"
            >
              <Camera className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
      <UpdateProfile />

      <div className="col-span-6 my-6 h-1 border-foreground border-b-[1.5px]" />
      <div className="col-span-full flex flex-col gap-6">
        <Link className="flex items-center gap-2" to="password">
          <EyeOffIcon className="h-4 w-4" />
          <span>Change Password</span>
        </Link>
        <Link className="flex items-center gap-2" to="connections">
          <Link2Icon className="h-4 w-4" />
          <span>Manage connections</span>
        </Link>
        <SignOutOfSessions />
        <DeleteData />
      </div>
    </div>
  );
}

async function profileUpdateAction({ userId, formData }: ProfileActionArgs) {
  const submission = await parseWithZod(formData, {
    async: true,
    schema: ProfileFormSchema.superRefine(async ({ username }, ctx) => {
      const existingUsername = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });
      if (existingUsername && existingUsername.id !== userId) {
        ctx.addIssue({
          path: ["username"],
          code: z.ZodIssueCode.custom,
          message: "A user already exists with this username",
        });
      }
    }),
  });
  if (submission.status !== "success") {
    return data(
      { result: submission.reply() },
      { status: submission.status === "error" ? 400 : 200 }
    );
  }
  const { username, name } = submission.value;

  await auth.api.updateUser({
    body: {
      username,
      name,
    },
  });

  return data({
    result: submission.reply(),
  });
}

function UpdateProfile() {
  const data = useLoaderData<typeof loader>();

  const fetcher = useFetcher<typeof profileUpdateAction>();

  const [form, fields] = useForm({
    id: "edit-profile",
    constraint: getZodConstraint(ProfileFormSchema),
    lastResult: fetcher.data?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ProfileFormSchema });
    },
    defaultValue: {
      username: data?.user?.username,
      name: data?.user?.name,
    },
  });

  return (
    <fetcher.Form method="POST" {...getFormProps(form)}>
      <AuthenticityTokenInput />
      <div className="grid grid-cols-6 gap-x-10">
        <Field
          className="col-span-3"
          errors={fields.username.errors}
          inputProps={getInputProps(fields.username, {
            type: "text",
          })}
          labelProps={{
            htmlFor: fields.username.id,
            children: "Username",
          }}
        />
        <Field
          className="col-span-3"
          errors={fields.name.errors}
          inputProps={getInputProps(fields.name, { type: "text" })}
          labelProps={{ htmlFor: fields.name.id, children: "Name" }}
        />
      </div>

      <ErrorList errors={form.errors} id={form.errorId} />

      <div className="mt-8 flex justify-center">
        <StatusButton
          name="intent"
          status={
            fetcher.state !== "idle" ? "pending" : (form.status ?? "idle")
          }
          type="submit"
          value={profileUpdateActionIntent}
        >
          Save changes
        </StatusButton>
      </div>
    </fetcher.Form>
  );
}

async function signOutOfSessionsAction({ request }: { request: Request }) {
  const authSession = await auth.api.getSession({
    headers: request.headers,
  });
  invariantResponse(
    authSession,
    "You must be authenticated to sign out of other sessions"
  );
  await auth.api.revokeOtherSessions({
    headers: request.headers,
  });
  return data({ status: "success" } as const);
}

function SignOutOfSessions() {
  const data = useLoaderData<typeof loader>();
  const dc = useDoubleCheck();

  const fetcher = useFetcher<typeof signOutOfSessionsAction>();
  const otherSessionsCount = data.otherSessionsCount;
  return (
    <>
      {otherSessionsCount ? (
        <fetcher.Form method="POST">
          <AuthenticityTokenInput />
          <StatusButton
            {...dc.getButtonProps({
              type: "submit",
              name: "intent",
              value: signOutOfSessionsActionIntent,
            })}
            status={
              fetcher.state !== "idle"
                ? "pending"
                : (fetcher.data?.status ?? "idle")
            }
            variant={dc.doubleCheck ? "destructive" : "default"}
          >
            <div className="flex items-center gap-2">
              <User2Icon className="h-4 w-4" />
              <span>
                {dc.doubleCheck
                  ? "Are you sure?"
                  : `Sign out of ${otherSessionsCount} other sessions`}
              </span>
            </div>
          </StatusButton>
        </fetcher.Form>
      ) : (
        <div className="flex items-center gap-2">
          <User2Icon className="h-4 w-4" />
          <span>This is your only session</span>
        </div>
      )}
    </>
  );
}

async function deleteDataAction({
  token,
}: {
  request: Request;
  token: string;
}) {
  await auth.api.deleteUser({
    body: {
      token,
    },
  });
  return redirectWithToast("/", {
    type: "success",
    title: "Data Deleted",
    description: "All of your data has been deleted",
  });
}

function DeleteData() {
  const dc = useDoubleCheck();

  const fetcher = useFetcher<typeof deleteDataAction>();
  return (
    <fetcher.Form method="POST">
      <AuthenticityTokenInput />
      <StatusButton
        {...dc.getButtonProps({
          type: "submit",
          name: "intent",
          value: deleteDataActionIntent,
        })}
        status={fetcher.state !== "idle" ? "pending" : "idle"}
        variant={dc.doubleCheck ? "destructive" : "default"}
      >
        <div className="flex items-center gap-2">
          <TrashIcon className="h-4 w-4" />
          <span>
            {dc.doubleCheck ? "Are you sure?" : "Delete all your data"}
          </span>
        </div>
      </StatusButton>
    </fetcher.Form>
  );
}
