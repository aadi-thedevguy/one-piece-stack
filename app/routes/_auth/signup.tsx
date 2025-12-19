import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { invariant } from "@epic-web/invariant";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { Fragment } from "react/jsx-runtime";
import {
  data,
  Form,
  type MetaFunction,
  useActionData,
  useSearchParams,
} from "react-router";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { safeRedirect } from "remix-utils/safe-redirect";
import { z } from "zod";
import { GeneralErrorBoundary } from "~/components/layout/error-boundary";
import { CheckboxField, ErrorList, Field } from "~/components/layout/forms";
import { Spacer } from "~/components/layout/spacer";
import { StatusButton } from "~/components/layout/status-button";
import { auth } from "~/lib/auth/auth.server";
import { ProviderConnectionForm } from "~/lib/auth/connections";
import { validateCSRF } from "~/lib/csrf.server";
import { prisma } from "~/lib/db.server";
import { checkHoneypot } from "~/lib/honeypot.server";
import { redirectWithToast } from "~/lib/toast.server";
import { useIsPending } from "~/lib/utils";
import { providerNames } from "~/lib/validations";
import { FinalSignupFormSchema } from "~/lib/validations/user-validation";
import type { Route } from "./+types/signup";

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  await validateCSRF(formData, request.headers);
  checkHoneypot(formData);

  const submission = await parseWithZod(formData, {
    schema: FinalSignupFormSchema.superRefine(async (data, ctx) => {
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
      const response = await auth.api.isUsernameAvailable({
        body: {
          username,
        },
      });
      if (!response.available) {
        ctx.addIssue({
          path: ["username"],
          code: z.ZodIssueCode.custom,
          message: "A user already exists with this username",
        });
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
  const { redirectTo, username } = submission.value;

  try {
    const { token } = await auth.api.signUpEmail({
      body: {
        ...submission.value,
      },
    });
    invariant(token, "Failed to send email");

    if (redirectTo) {
      return redirectWithToast(
        safeRedirect(redirectTo),
        { title: "Email Sent!", description: "Please check your inbox" },
        { headers: request.headers }
      );
    }
    return redirectWithToast(
      safeRedirect("/signup"),
      { title: "Email Sent!", description: "Please check your inbox" },
      { headers: request.headers }
    );
  } catch (error) {
    if (error instanceof Error) {
      return data(
        {
          result: submission.reply({ formErrors: [error.message] }),
        },
        {
          status: 500,
        }
      );
    }
  }
}

export const meta: MetaFunction = () => [
  { title: "Sign Up | One Piece Stack" },
];

export default function SignupRoute() {
  const actionData = useActionData<typeof action>();
  const isPending = useIsPending();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const [form, fields] = useForm({
    id: "signup-form",
    constraint: getZodConstraint(FinalSignupFormSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      const result = parseWithZod(formData, { schema: FinalSignupFormSchema });
      return result;
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <div className="container flex flex-col justify-center pt-20 pb-32">
      <div className="text-center">
        <h1 className="text-h1">Let's start your journey!</h1>
        <p className="mt-3 text-body-md text-muted-foreground">
          Please enter your details.
        </p>
      </div>
      <Spacer size="xs" />

      <div className="mx-auto mt-8 min-w-full max-w-sm sm:min-w-92">
        <Form method="POST" {...getFormProps(form)}>
          <AuthenticityTokenInput />
          <HoneypotInputs />

          <Field
            errors={fields.username.errors}
            inputProps={{
              ...getInputProps(fields.username, { type: "text" }),
              autoComplete: "username",
              className: "lowercase",
            }}
            labelProps={{
              htmlFor: fields.username.id,
              children: "Username",
              className: "mb-2",
            }}
          />
          <Field
            errors={fields.name.errors}
            inputProps={{
              ...getInputProps(fields.name, { type: "text" }),
              autoComplete: "name",
            }}
            labelProps={{
              htmlFor: fields.name.id,
              children: "Name",
              className: "mb-2",
            }}
          />

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
              className: "mb-2",
            }}
          />
          <Field
            errors={fields.password.errors}
            inputProps={{
              ...getInputProps(fields.password, { type: "password" }),
              autoComplete: "new-password",
            }}
            labelProps={{
              htmlFor: fields.password.id,
              children: "Password",
              className: "mb-2",
            }}
          />

          <Field
            errors={fields.confirmPassword.errors}
            inputProps={{
              ...getInputProps(fields.confirmPassword, { type: "password" }),
              autoComplete: "new-password",
            }}
            labelProps={{
              htmlFor: fields.confirmPassword.id,
              children: "Confirm Password",
              className: "mb-2",
            }}
          />
          <CheckboxField
            buttonProps={getInputProps(
              fields.agreeToTermsOfServiceAndPrivacyPolicy,
              { type: "checkbox" }
            )}
            errors={fields.agreeToTermsOfServiceAndPrivacyPolicy.errors}
            labelProps={{
              htmlFor: fields.agreeToTermsOfServiceAndPrivacyPolicy.id,
              children:
                "Do you agree to our Terms of Service and Privacy Policy?",
            }}
          />
          <CheckboxField
            buttonProps={getInputProps(fields.remember, { type: "checkbox" })}
            errors={fields.remember.errors}
            labelProps={{
              htmlFor: fields.remember.id,
              children: "Remember me",
            }}
          />
          {redirectTo ? (
            <input name="redirectTo" type="hidden" value={redirectTo} />
          ) : null}

          <ErrorList errors={form.errors} id={form.errorId} />
          <StatusButton
            className="w-full"
            disabled={isPending}
            status={isPending ? "pending" : (form.status ?? "idle")}
            type="submit"
          >
            Create an Account
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
