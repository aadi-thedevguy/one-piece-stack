import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { Fragment } from "react/jsx-runtime";
import { data, Form, redirect, useSearchParams } from "react-router";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";
import { GeneralErrorBoundary } from "~/components/layout/error-boundary";
import { ErrorList, Field } from "~/components/layout/forms";
import { StatusButton } from "~/components/layout/status-button";
import { SignupEmail } from "~/components/mails/SignupEmail.js";
import { ProviderConnectionForm } from "~/lib/auth/connections";
import { prisma } from "~/lib/db.server";
import { sendEmail } from "~/lib/email.server";
import { checkHoneypot } from "~/lib/honeypot.server";
import { useIsPending } from "~/lib/utils";
import { providerNames } from "~/lib/validations";
import { EmailSchema } from "~/lib/validations/user-validation";
import { requireAnonymousMiddleware } from "~/middleware.server.js";
import type { Route } from "./+types/signup.ts";
import { prepareVerification } from "./verify.server";

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};

const SignupSchema = z.object({
  email: EmailSchema,
});

export const middleware = [requireAnonymousMiddleware];

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  // await validateCSRF(formData, request.headers);
  checkHoneypot(formData);

  const submission = await parseWithZod(formData, {
    schema: SignupSchema.superRefine(async (data, ctx) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true },
      });
      if (existingUser) {
        ctx.addIssue({
          path: ["email"],
          code: z.ZodIssueCode.custom,
          message: "A user already exists with this email",
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
  const { email } = submission.value;
  const { verifyUrl, redirectTo, otp } = await prepareVerification({
    period: 10 * 60,
    request,
    type: "onboarding",
    target: email,
  });

  const response = await sendEmail({
    to: email,
    subject: "Welcome to One Piece App!",
    react: <SignupEmail onboardingUrl={verifyUrl.toString()} otp={otp} />,
  });

  if (response.status === "success") {
    return redirect(redirectTo.toString());
  }
  return data(
    {
      result: submission.reply({ formErrors: [response.error.message] }),
    },
    {
      status: 500,
    }
  );
}

export const meta: Route.MetaFunction = () => [
  { title: "Sign Up | One Piece App" },
];

export default function SignupRoute({ actionData }: Route.ComponentProps) {
  const isPending = useIsPending();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const [form, fields] = useForm({
    id: "signup-form",
    constraint: getZodConstraint(SignupSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      const result = parseWithZod(formData, { schema: SignupSchema });
      return result;
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <div className="container flex flex-col justify-center pt-20 pb-32">
      <div className="text-center">
        <h1 className="text-h1">Let's start your journey!</h1>
        <p className="mt-3 text-body-md text-muted-foreground">
          Please enter your email.
        </p>
      </div>
      <div className="mx-auto mt-16 min-w-full max-w-sm sm:min-w-92">
        <Form method="POST" {...getFormProps(form)}>
          {/* <AuthenticityTokenInput /> */}
          <HoneypotInputs />
          <Field
            errors={fields.email.errors}
            inputProps={{
              ...getInputProps(fields.email, { type: "email" }),
              autoFocus: true,
              autoComplete: "email",
            }}
            labelProps={{
              htmlFor: fields.email.id,
              children: "Email",
            }}
          />
          <ErrorList errors={form.errors} id={form.errorId} />
          <StatusButton
            className="w-full"
            disabled={isPending}
            status={isPending ? "pending" : (form.status ?? "idle")}
            type="submit"
          >
            Submit
          </StatusButton>
        </Form>
        <ul className="flex flex-col gap-4 py-4">
          {providerNames.map((providerName) => (
            <Fragment key={providerName}>
              <hr />
              <li>
                <ProviderConnectionForm
                  providerName={providerName}
                  redirectTo={redirectTo}
                  type="Signup"
                />
              </li>
            </Fragment>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
