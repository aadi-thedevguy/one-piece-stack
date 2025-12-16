import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { invariant } from "@epic-web/invariant";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import {
  type ActionFunctionArgs,
  data,
  Link,
  type MetaFunction,
  useFetcher,
} from "react-router";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";
import { GeneralErrorBoundary } from "~/components/layout/error-boundary";
import { ErrorList, Field } from "~/components/layout/forms";
import { StatusButton } from "~/components/layout/status-button";
import { auth } from "~/lib/auth/auth.server";
import { validateCSRF } from "~/lib/csrf.server";
import { prisma } from "~/lib/db.server";
import { checkHoneypot } from "~/lib/honeypot.server";
import { redirectWithToast } from "~/lib/toast.server";
import { ForgotPasswordSchema } from "~/lib/validations/user-validation";

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  await validateCSRF(formData, request.headers);
  checkHoneypot(formData);
  let userEmail = "";
  const submission = await parseWithZod(formData, {
    schema: ForgotPasswordSchema.superRefine(async (data, ctx) => {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: data.usernameOrEmail },
            { username: data.usernameOrEmail },
          ],
        },
        select: { id: true, email: true },
      });
      if (!user) {
        ctx.addIssue({
          path: ["usernameOrEmail"],
          code: z.ZodIssueCode.custom,
          message: "No user exists with this username or email",
        });
        return;
      }
      userEmail = user.email;
    }),
    async: true,
  });
  if (submission.status !== "success") {
    return data(
      { result: submission.reply() },
      { status: submission.status === "error" ? 400 : 200 }
    );
  }
  const response = await auth.api.requestPasswordReset({
    body: {
      email: userEmail,
      // redirectTo: "/auth/reset-password",
    },
  });

  invariant(response, "Failed to Reset the password");

  if (response.status) {
    return redirectWithToast("/auth/reset-password", {
      title: "Password Reset Mail Sent!",
      description: "Please check your inbox",
    });
  }
  if (!response.status) {
    return data(
      {
        result: submission.reply({
          formErrors: [response.message],
        }),
      },
      { status: 500 }
    );
  }
}

export const meta: MetaFunction = () => [
  { title: "Password Recovery for One Piece Stack" },
];

export default function ForgotPasswordRoute() {
  const forgotPassword = useFetcher<typeof action>();

  const [form, fields] = useForm({
    id: "forgot-password-form",
    constraint: getZodConstraint(ForgotPasswordSchema),
    lastResult: forgotPassword.data?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ForgotPasswordSchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <div className="container pt-20 pb-32">
      <div className="flex flex-col justify-center">
        <div className="text-center">
          <h1 className="text-h1">Forgot Password</h1>
          <p className="mt-3 text-body-md text-muted-foreground">
            No worries, we&apos;ll send you reset instructions.
          </p>
        </div>
        <div className="mx-auto mt-16 min-w-full max-w-sm sm:min-w-[368px]">
          <forgotPassword.Form method="POST" {...getFormProps(form)}>
            <AuthenticityTokenInput />
            <HoneypotInputs />
            <div>
              <Field
                errors={fields.usernameOrEmail.errors}
                inputProps={{
                  autoFocus: true,
                  ...getInputProps(fields.usernameOrEmail, {
                    type: "text",
                  }),
                }}
                labelProps={{
                  htmlFor: fields.usernameOrEmail.id,
                  children: "Username or Email",
                }}
              />
            </div>
            <ErrorList errors={form.errors} id={form.errorId} />

            <div className="mt-6">
              <StatusButton
                className="w-full"
                disabled={forgotPassword.state !== "idle"}
                status={
                  forgotPassword.state === "submitting"
                    ? "pending"
                    : (form.status ?? "idle")
                }
                type="submit"
              >
                Recover password
              </StatusButton>
            </div>
          </forgotPassword.Form>
          <Link
            className="mt-11 text-center font-bold text-body-sm"
            to="/login"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
