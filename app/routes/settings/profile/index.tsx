import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { invariantResponse } from "@epic-web/invariant";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import {
  Camera,
  CircleUser,
  Download,
  Link2,
  Lock,
  Mail,
  MoreHorizontal,
  Unlock,
} from "lucide-react";
import { Img } from "openimg/react";
import { data, Link, useFetcher } from "react-router";
import { z } from "zod";
import { ErrorList, Field } from "~/components/layout/forms";
import { StatusButton } from "~/components/layout/status-button";
import { Button } from "~/components/ui/button";
import {
  profileUpdateActionIntent,
  sessionKey,
  signOutOfSessionsActionIntent,
} from "~/constants/keys";
import { userIdContext } from "~/context";
import { requireUserId } from "~/lib/auth/auth.server";
import { authSessionStorage } from "~/lib/auth/session.server";
import { prisma } from "~/lib/db.server";
import { getUserImgSrc, useDoubleCheck } from "~/lib/utils";
import { NameSchema, UsernameSchema } from "~/lib/validations/user-validation";
import type { Route } from "./+types";
import { twoFAVerificationType } from "./two-factor/_layout";

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};

const ProfileFormSchema = z.object({
  name: NameSchema.nullable().default(null),
  username: UsernameSchema,
});

export async function loader({ context }: Route.LoaderArgs) {
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: {
        select: { objectKey: true },
      },
      roles: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          sessions: {
            where: {
              expirationDate: { gt: new Date() },
            },
          },
        },
      },
    },
  });

  const [twoFactorVerification, password] = await Promise.all([
    prisma.verification.findUnique({
      select: { id: true },
      where: { target_type: { type: twoFAVerificationType, target: userId } },
    }),
    prisma.password.findUnique({
      select: { userId: true },
      where: { userId },
    }),
  ]);

  return {
    user,
    hasPassword: Boolean(password),
    isTwoFactorEnabled: Boolean(twoFactorVerification),
  };
}

type ProfileActionArgs = {
  request: Request;
  userId: string;
  formData: FormData;
};

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  switch (intent) {
    case profileUpdateActionIntent: {
      return profileUpdateAction({ request, userId, formData });
    }
    case signOutOfSessionsActionIntent: {
      return signOutOfSessionsAction({ request, userId, formData });
    }
    default: {
      throw new Response(`Invalid intent "${intent}"`, { status: 400 });
    }
  }
}

export default function EditUserProfile({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex justify-center">
        <div className="relative size-52">
          <Img
            alt={loaderData.user.name ?? loaderData.user.username}
            className="h-full w-full rounded-full object-cover"
            height={832}
            isAboveFold
            src={getUserImgSrc(loaderData.user.image?.objectKey)}
            width={832}
          />
          <Button
            asChild
            className="-right-3 absolute top-3 flex size-10 items-center justify-center rounded-full p-0"
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
      <UpdateProfile loaderData={loaderData} />

      <div className="col-span-6 my-6 h-1 border-foreground border-b-[1.5px]" />
      <div className="col-span-full flex flex-col gap-6">
        <div>
          <Link className="flex items-center gap-2" to="change-email">
            <Mail />
            <span>Change email from {loaderData.user.email}</span>
          </Link>
        </div>
        <div>
          <Link className="flex items-center gap-2" to="two-factor">
            {loaderData.isTwoFactorEnabled ? (
              <>
                <Lock />
                <span>2FA is enabled</span>
              </>
            ) : (
              <>
                <Unlock />
                <span>Enable 2FA</span>
              </>
            )}
          </Link>
        </div>
        <div>
          <Link
            className="flex items-center gap-2"
            to={loaderData.hasPassword ? "password" : "password/create"}
          >
            <MoreHorizontal />
            <span>
              {loaderData.hasPassword ? "Change Password" : "Create a Password"}
            </span>
          </Link>
        </div>
        <div>
          <Link className="flex items-center gap-2" to="connections">
            <Link2 />
            <span>Manage connections</span>
          </Link>
        </div>
        <div>
          <Link className="flex items-center gap-2" to="passkeys">
            <Unlock />
            <span>Manage passkeys</span>
          </Link>
        </div>
        <div>
          <Link
            className="flex items-center gap-2"
            download="my-epic-notes-data.json"
            reloadDocument
            to="/resources/download-user-data"
          >
            <Download />
            <span>Download your data</span>
          </Link>
        </div>
        <SignOutOfSessions loaderData={loaderData} />
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

  await prisma.user.update({
    select: { username: true },
    where: { id: userId },
    data: {
      name,
      username,
    },
  });

  return {
    result: submission.reply(),
  };
}

function UpdateProfile({
  loaderData,
}: {
  loaderData: Route.ComponentProps["loaderData"];
}) {
  const fetcher = useFetcher<typeof profileUpdateAction>();

  const [form, fields] = useForm({
    id: "edit-profile",
    constraint: getZodConstraint(ProfileFormSchema),
    lastResult: fetcher.data?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ProfileFormSchema });
    },
    defaultValue: {
      username: loaderData.user.username,
      name: loaderData.user.name,
    },
  });

  return (
    <fetcher.Form method="POST" {...getFormProps(form)}>
      <div className="grid grid-cols-6 gap-x-10">
        <Field
          className="col-span-3"
          errors={fields.username.errors}
          inputProps={getInputProps(fields.username, { type: "text" })}
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
          size="wide"
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

async function signOutOfSessionsAction({ request, userId }: ProfileActionArgs) {
  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie")
  );
  const sessionId = authSession.get(sessionKey);
  invariantResponse(
    sessionId,
    "You must be authenticated to sign out of other sessions"
  );
  await prisma.session.deleteMany({
    where: {
      userId,
      id: { not: sessionId },
    },
  });
  return { status: "success" } as const;
}

function SignOutOfSessions({
  loaderData,
}: {
  loaderData: Route.ComponentProps["loaderData"];
}) {
  const dc = useDoubleCheck();

  const fetcher = useFetcher<typeof signOutOfSessionsAction>();
  const otherSessionsCount = loaderData.user._count.sessions - 1;
  return (
    <div>
      {otherSessionsCount ? (
        <fetcher.Form method="POST">
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
              <CircleUser />
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
          <CircleUser />
          <span>This is your only session</span>
        </div>
      )}
    </div>
  );
}
