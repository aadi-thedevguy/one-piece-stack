import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { data, Form, redirect, useSearchParams } from "react-router";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { safeRedirect } from "remix-utils/safe-redirect";
import { z } from "zod";
import { CheckboxField, ErrorList, Field } from "~/components/layout/forms";
import { Spacer } from "~/components/layout/spacer";
import { StatusButton } from "~/components/layout/status-button";
import { onboardingEmailSessionKey, sessionKey } from "~/constants/keys.js";
import { checkIsCommonPassword, signup } from "~/lib/auth/auth.server";
import { authSessionStorage } from "~/lib/auth/session.server";
import { verifySessionStorage } from "~/lib/auth/verification.server";
import { validateCSRF } from "~/lib/csrf.server";
import { prisma } from "~/lib/db.server";
import { checkHoneypot } from "~/lib/honeypot.server";
import { redirectWithToast } from "~/lib/toast.server";
import { useIsPending } from "~/lib/utils";
import {
  NameSchema,
  PasswordAndConfirmPasswordSchema,
  UsernameSchema,
} from "~/lib/validations/user-validation";
import { requireAnonymousMiddleware } from "~/middleware.server";
import type { Route } from "./+types/$provider";

const SignupFormSchema = z
  .object({
    username: UsernameSchema,
    name: NameSchema,
    agreeToTermsOfServiceAndPrivacyPolicy: z.boolean({
      required_error:
        "You must agree to the terms of service and privacy policy",
    }),
    remember: z.boolean().optional(),
    redirectTo: z.string().optional(),
  })
  .and(PasswordAndConfirmPasswordSchema);

async function requireOnboardingEmail(request: Request) {
  const verifySession = await verifySessionStorage.getSession(
    request.headers.get("cookie")
  );
  const email = verifySession.get(onboardingEmailSessionKey);
  if (typeof email !== "string" || !email) {
    throw redirect("/signup");
  }
  return email;
}

export const middleware = [requireAnonymousMiddleware];

export async function loader({ request }: Route.LoaderArgs) {
  const email = await requireOnboardingEmail(request);
  return { email };
}

export async function action({ request }: Route.ActionArgs) {
  const email = await requireOnboardingEmail(request);
  const formData = await request.formData();
  await validateCSRF(formData, request.headers);
  checkHoneypot(formData);
  const submission = await parseWithZod(formData, {
    schema: (intent) =>
      SignupFormSchema.superRefine(async (data, ctx) => {
        const existingUser = await prisma.user.findUnique({
          where: { username: data.username },
          select: { id: true },
        });
        if (existingUser) {
          ctx.addIssue({
            path: ["username"],
            code: z.ZodIssueCode.custom,
            message: "A user already exists with this username",
          });
          return;
        }
        const isCommonPassword = await checkIsCommonPassword(data.password);
        if (isCommonPassword) {
          ctx.addIssue({
            path: ["password"],
            code: "custom",
            message: "Password is too common",
          });
        }
      }).transform(async (data) => {
        if (intent !== null) return { ...data, session: null };

        const session = await signup({ ...data, email });
        return { ...data, session };
      }),
    async: true,
  });

  if (submission.status !== "success" || !submission.value.session) {
    return data(
      { result: submission.reply() },
      { status: submission.status === "error" ? 400 : 200 }
    );
  }

  const { session, remember, redirectTo } = submission.value;

  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie")
  );
  authSession.set(sessionKey, session.id);
  const verifySession = await verifySessionStorage.getSession();
  const headers = new Headers();
  headers.append(
    "set-cookie",
    await authSessionStorage.commitSession(authSession, {
      expires: remember ? session.expirationDate : undefined,
    })
  );
  headers.append(
    "set-cookie",
    await verifySessionStorage.destroySession(verifySession)
  );

  return redirectWithToast(
    safeRedirect(redirectTo),
    { title: "Welcome", description: "Thanks for signing up!" },
    { headers }
  );
}

export const meta: Route.MetaFunction = () => [
  { title: "Setup Epic Notes Account" },
];

export default function OnboardingRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const isPending = useIsPending();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const [form, fields] = useForm({
    id: "onboarding-form",
    constraint: getZodConstraint(SignupFormSchema),
    defaultValue: { redirectTo },
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SignupFormSchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <div className="container flex min-h-full flex-col justify-center pt-20 pb-32">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-h1">Welcome aboard {loaderData.email}!</h1>
          <p className="text-body-md text-muted-foreground">
            Please enter your details.
          </p>
        </div>
        <Spacer size="xs" />
        <Form
          className="mx-auto min-w-full max-w-sm sm:min-w-92"
          method="POST"
          {...getFormProps(form)}
        >
          <AuthenticityTokenInput />
          <HoneypotInputs />
          <Field
            errors={fields.username.errors}
            inputProps={{
              ...getInputProps(fields.username, { type: "text" }),
              autoComplete: "username",
              className: "lowercase",
            }}
            labelProps={{ htmlFor: fields.username.id, children: "Username" }}
          />
          <Field
            errors={fields.name.errors}
            inputProps={{
              ...getInputProps(fields.name, { type: "text" }),
              autoComplete: "name",
            }}
            labelProps={{ htmlFor: fields.name.id, children: "Name" }}
          />
          <Field
            errors={fields.password.errors}
            inputProps={{
              ...getInputProps(fields.password, { type: "password" }),
              autoComplete: "new-password",
            }}
            labelProps={{ htmlFor: fields.password.id, children: "Password" }}
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

          <input {...getInputProps(fields.redirectTo, { type: "hidden" })} />
          <ErrorList errors={form.errors} id={form.errorId} />

          <div className="flex items-center justify-between gap-6">
            <StatusButton
              className="w-full"
              disabled={isPending}
              status={isPending ? "pending" : (form.status ?? "idle")}
              type="submit"
            >
              Create an account
            </StatusButton>
          </div>
        </Form>
      </div>
    </div>
  );
}
