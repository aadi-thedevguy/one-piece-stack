import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { invariantResponse } from "@epic-web/invariant";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { data, Form, Link, redirect, useActionData } from "react-router";
import { ErrorList, Field } from "~/components/layout/forms";
import { StatusButton } from "~/components/layout/status-button";
import { Button } from "~/components/ui/button";
import { userContext } from "~/context";
import { auth } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db.server";
import { redirectWithToast } from "~/lib/toast.server";
import { useIsPending } from "~/lib/utils";
import type { BreadcrumbHandle } from "~/lib/validations";
import { PasswordAndConfirmPasswordSchema } from "~/lib/validations/user-validation";
import type { Route } from "./+types/password_.create";

const CreatePasswordForm = PasswordAndConfirmPasswordSchema;

export const handle: BreadcrumbHandle & SEOHandle = {
  breadcrumb: (
    <div className="flex items-center gap-2">
      <DotsHorizontalIcon className="h-4 w-4" />
      <span>Password</span>
    </div>
  ),
  getSitemapEntries: () => null,
};

async function requireNoPassword(userId: string) {
  const passwordAccount = await prisma.account.findFirst({
    where: {
      userId,
      password: {
        not: null,
      },
    },
  });

  if (passwordAccount) {
    throw redirect("/settings/profile/password");
  }
}

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userContext);
  invariantResponse(user, "User not found", { status: 404 });
  await requireNoPassword(user.id);
  return data({});
}

export async function action({ request, context }: Route.ActionArgs) {
  const user = context.get(userContext);
  invariantResponse(user, "User not found", { status: 404 });

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    async: true,
    schema: CreatePasswordForm,
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

  await auth.api.setPassword({
    body: {
      newPassword: password,
    },
  });

  return redirectWithToast(
    "/settings/profile",
    {
      type: "success",
      title: "Password Created",
      description: "Your password has been created.",
    },
    { status: 302 }
  );
}

export default function CreatePasswordRoute() {
  const actionData = useActionData<typeof action>();
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
