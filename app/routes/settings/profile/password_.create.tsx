import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { invariantResponse } from "@epic-web/invariant";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { data, Form, Link, redirect } from "react-router";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { ErrorList, Field } from "~/components/layout/forms";
import { StatusButton } from "~/components/layout/status-button";
import { Button } from "~/components/ui/button";
import { userIdContext } from "~/context";
import { checkIsCommonPassword, getPasswordHash } from "~/lib/auth/auth.server";
import { validateCSRF } from "~/lib/csrf.server";
import { prisma } from "~/lib/db.server";
import { useIsPending } from "~/lib/utils";
import { PasswordAndConfirmPasswordSchema } from "~/lib/validations/user-validation";
import type { BreadcrumbHandle } from "./_layout";
import type { Route } from "./+types/password_.create";

export const handle: BreadcrumbHandle & SEOHandle = {
  breadcrumb: (
    <div className="flex items-center gap-2">
      <DotsHorizontalIcon className="h-4 w-4" />
      <span>Password</span>
    </div>
  ),
  getSitemapEntries: () => null,
};

const CreatePasswordForm = PasswordAndConfirmPasswordSchema;

async function requireNoPassword(userId: string) {
  const password = await prisma.password.findUnique({
    select: { userId: true },
    where: { userId },
  });
  if (password) {
    throw redirect("/settings/profile/password");
  }
}

export async function loader({ context }: Route.LoaderArgs) {
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });
  await requireNoPassword(userId);
  return {};
}

export async function action({ request, context }: Route.ActionArgs) {
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });

  await requireNoPassword(userId);
  const formData = await request.formData();
  await validateCSRF(formData, request.headers);
  const submission = await parseWithZod(formData, {
    async: true,
    schema: CreatePasswordForm.superRefine(async ({ password }, ctx) => {
      const isCommonPassword = await checkIsCommonPassword(password);
      if (isCommonPassword) {
        ctx.addIssue({
          path: ["password"],
          code: "custom",
          message: "Password is too common",
        });
      }
    }),
  });
  if (submission.status !== "success") {
    return data(
      {
        result: submission.reply({
          hideFields: ["password", "confirmPassword"],
        }),
      },
      { status: submission.status === "error" ? 400 : 200 }
    );
  }

  const { password } = submission.value;

  await prisma.user.update({
    select: { username: true },
    where: { id: userId },
    data: {
      password: {
        create: {
          hash: await getPasswordHash(password),
        },
      },
    },
  });

  return redirect("/settings/profile", { status: 302 });
}

export default function CreatePasswordRoute({
  actionData,
}: Route.ComponentProps) {
  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: "password-create-form",
    constraint: getZodConstraint(CreatePasswordForm),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: CreatePasswordForm });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <Form method="POST" {...getFormProps(form)} className="mx-auto max-w-md">
      <AuthenticityTokenInput />
      <Field
        errors={fields.password.errors}
        inputProps={{
          ...getInputProps(fields.password, { type: "password" }),
          autoComplete: "new-password",
        }}
        labelProps={{ children: "New Password" }}
      />
      <Field
        errors={fields.confirmPassword.errors}
        inputProps={{
          ...getInputProps(fields.confirmPassword, {
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
          Create Password
        </StatusButton>
      </div>
    </Form>
  );
}
