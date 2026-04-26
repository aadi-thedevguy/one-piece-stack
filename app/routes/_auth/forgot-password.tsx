import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { data, Link, redirect, useFetcher } from "react-router";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";
import { GeneralErrorBoundary } from "~/components/layout/error-boundary";
import { ErrorList, Field } from "~/components/layout/forms";
import { StatusButton } from "~/components/layout/status-button";
import { ForgotPasswordEmail } from "~/components/mails/forgot-password.js";
import { validateCSRF } from "~/lib/csrf.server.js";
import { prisma } from "~/lib/db.server";
import { sendEmail } from "~/lib/email.server";
import { checkHoneypot } from "~/lib/honeypot.server";
import { EmailSchema, UsernameSchema } from "~/lib/validations/user-validation";
import type { Route } from "./+types/forgot-password.ts";
import { prepareVerification } from "./verify.server";

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};

const ForgotPasswordSchema = z.object({
  usernameOrEmail: z.union([EmailSchema, UsernameSchema]),
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  await validateCSRF(formData, request.headers);
  checkHoneypot(formData);
  const submission = await parseWithZod(formData, {
    schema: ForgotPasswordSchema.superRefine(async (data, ctx) => {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: data.usernameOrEmail },
            { username: data.usernameOrEmail },
          ],
        },
        select: { id: true },
      });
      if (!user) {
        ctx.addIssue({
          path: ["usernameOrEmail"],
          code: z.ZodIssueCode.custom,
          message: "No user exists with this username or email",
        });
        return;
      }
    }),
    async: true,
  });
  if (submission.status !== "success") {
    return data(
      { result: submission.reply() },
      { status: submission.status === "error" ? 400 : 200 }
    );
  }
  const { usernameOrEmail } = submission.value;

  const user = await prisma.user.findFirstOrThrow({
    where: { OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }] },
    select: { email: true, username: true },
  });

  const { verifyUrl, redirectTo, otp } = await prepareVerification({
    period: 10 * 60,
    request,
    type: "reset-password",
    target: usernameOrEmail,
  });

  const response = await sendEmail({
    to: user.email,
    subject: "One Piece App - Password Reset",
    react: (
      <ForgotPasswordEmail onboardingUrl={verifyUrl.toString()} otp={otp} />
    ),
  });

  if (response.status === "success") {
    return redirect(redirectTo.toString());
  }
  return data(
    { result: submission.reply({ formErrors: [response.error.message] }) },
    { status: 500 }
  );
}

export const meta: Route.MetaFunction = () => [
  { title: "Password Recovery for One Piece App" },
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
            No worries, we'll send you reset instructions.
          </p>
        </div>
        <div className="mx-auto mt-16 min-w-full max-w-sm sm:min-w-92">
          <forgotPassword.Form method="POST" {...getFormProps(form)}>
            <AuthenticityTokenInput />
            <HoneypotInputs />
            <div>
              <Field
                errors={fields.usernameOrEmail.errors}
                inputProps={{
                  autoFocus: true,
                  ...getInputProps(fields.usernameOrEmail, { type: "text" }),
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
