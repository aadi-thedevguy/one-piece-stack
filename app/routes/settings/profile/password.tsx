import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { invariantResponse } from "@epic-web/invariant";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { MoreHorizontal } from "lucide-react";
import { data, Form, Link, redirect } from "react-router";
import { z } from "zod";
import { ErrorList, Field } from "~/components/layout/forms";
import { StatusButton } from "~/components/layout/status-button";
import { Button } from "~/components/ui/button";
import { userIdContext } from "~/context";
import {
  checkIsCommonPassword,
  getPasswordHash,
  verifyUserPassword,
} from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db.server";
import { redirectWithToast } from "~/lib/toast.server";
import { useIsPending } from "~/lib/utils";
import { PasswordSchema } from "~/lib/validations/user-validation";
import type { BreadcrumbHandle } from "./_layout";
import type { Route } from "./+types/password";

export const handle: BreadcrumbHandle & SEOHandle = {
  breadcrumb: (
    <div className="flex items-center gap-2">
      <MoreHorizontal />
      <span>Password</span>
    </div>
  ),
  getSitemapEntries: () => null,
};

const ChangePasswordForm = z
  .object({
    currentPassword: PasswordSchema,
    newPassword: PasswordSchema,
    confirmNewPassword: PasswordSchema,
  })
  .superRefine(({ confirmNewPassword, newPassword }, ctx) => {
    if (confirmNewPassword !== newPassword) {
      ctx.addIssue({
        path: ["confirmNewPassword"],
        code: z.ZodIssueCode.custom,
        message: "The passwords must match",
      });
    }
  });

async function requirePassword(userId: string) {
  const password = await prisma.password.findUnique({
    select: { userId: true },
    where: { userId },
  });
  if (!password) {
    throw redirect("/settings/profile/password/create");
  }
}

export async function loader({ context }: Route.LoaderArgs) {
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });
  await requirePassword(userId);
  return {};
}

export async function action({ request, context }: Route.ActionArgs) {
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });

  await requirePassword(userId);
  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    async: true,
    schema: ChangePasswordForm.superRefine(
      async ({ currentPassword, newPassword }, ctx) => {
        if (currentPassword && newPassword) {
          const user = await verifyUserPassword(
            { id: userId },
            currentPassword
          );
          if (!user) {
            ctx.addIssue({
              path: ["currentPassword"],
              code: z.ZodIssueCode.custom,
              message: "Incorrect password.",
            });
          }
          const isCommonPassword = await checkIsCommonPassword(newPassword);
          if (isCommonPassword) {
            ctx.addIssue({
              path: ["newPassword"],
              code: "custom",
              message: "Password is too common",
            });
          }
        }
      }
    ),
  });
  if (submission.status !== "success") {
    return data(
      {
        result: submission.reply({
          hideFields: ["currentPassword", "newPassword", "confirmNewPassword"],
        }),
      },
      { status: submission.status === "error" ? 400 : 200 }
    );
  }

  const { newPassword } = submission.value;

  await prisma.user.update({
    select: { username: true },
    where: { id: userId },
    data: {
      password: {
        update: {
          hash: await getPasswordHash(newPassword),
        },
      },
    },
  });

  return redirectWithToast(
    "/settings/profile",
    {
      type: "success",
      title: "Password Changed",
      description: "Your password has been changed.",
    },
    { status: 302 }
  );
}

export default function ChangePasswordRoute({
  actionData,
}: Route.ComponentProps) {
  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: "password-change-form",
    constraint: getZodConstraint(ChangePasswordForm),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ChangePasswordForm });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <Form method="POST" {...getFormProps(form)} className="mx-auto max-w-md">
      <Field
        errors={fields.currentPassword.errors}
        inputProps={{
          ...getInputProps(fields.currentPassword, { type: "password" }),
          autoComplete: "current-password",
        }}
        labelProps={{ children: "Current Password" }}
      />
      <Field
        errors={fields.newPassword.errors}
        inputProps={{
          ...getInputProps(fields.newPassword, { type: "password" }),
          autoComplete: "new-password",
        }}
        labelProps={{ children: "New Password" }}
      />
      <Field
        errors={fields.confirmNewPassword.errors}
        inputProps={{
          ...getInputProps(fields.confirmNewPassword, {
            type: "password",
          }),
          autoComplete: "new-password",
        }}
        labelProps={{ children: "Confirm New Password" }}
      />
      <ErrorList errors={form.errors} id={form.errorId} />
      <div className="grid w-full grid-cols-2 gap-6">
        <Button asChild variant="secondary">
          <Link to="..">Cancel</Link>
        </Button>
        <StatusButton
          status={isPending ? "pending" : (form.status ?? "idle")}
          type="submit"
        >
          Change Password
        </StatusButton>
      </div>
    </Form>
  );
}
