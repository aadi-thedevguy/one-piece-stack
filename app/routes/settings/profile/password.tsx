import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { invariantResponse } from "@epic-web/invariant";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { APIError } from "better-auth";
import {
  type ActionFunctionArgs,
  data,
  Form,
  Link,
  type LoaderFunctionArgs,
  useActionData,
} from "react-router";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { ErrorList, Field } from "~/components/layout/forms";
import { StatusButton } from "~/components/layout/status-button";
import { Button } from "~/components/ui/button";
import { userContext } from "~/context";
import { auth } from "~/lib/auth/auth.server";
import { validateCSRF } from "~/lib/csrf.server";
import { redirectWithToast } from "~/lib/toast.server";
import { useIsPending } from "~/lib/utils";
import type { BreadcrumbHandle } from "~/lib/validations";
import { ChangePasswordForm } from "~/lib/validations/user-validation";

export const handle: BreadcrumbHandle & SEOHandle = {
  breadcrumb: (
    <div className="flex items-center gap-2">
      <DotsHorizontalIcon className="h-4 w-4" />
      <span>Password</span>
    </div>
  ),
  getSitemapEntries: () => null,
};

export async function loader({ context }: LoaderFunctionArgs) {
  const user = context.get(userContext);
  invariantResponse(user, "User not found", { status: 404 });
  return data({});
}

export async function action({ request, context }: ActionFunctionArgs) {
  const user = context.get(userContext);
  invariantResponse(user, "User not found", { status: 404 });
  const formData = await request.formData();
  await validateCSRF(formData, request.headers);
  const submission = await parseWithZod(formData, {
    async: true,
    schema: ChangePasswordForm,
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

  const { newPassword, currentPassword } = submission.value;

  try {
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
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
  } catch (error) {
    if (error instanceof APIError) {
      return data(
        {
          result: submission.reply({ formErrors: [error.message] }),
        },
        {
          status: 401,
        }
      );
    }
  }
}

export default function ChangePasswordRoute() {
  const actionData = useActionData<typeof action>();
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
      <AuthenticityTokenInput />
      <Field
        errors={fields.currentPassword.errors}
        inputProps={{
          ...getInputProps(fields.currentPassword, {
            type: "password",
          }),
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
