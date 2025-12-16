import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import {
  type ActionFunctionArgs,
  data,
  Form,
  Link,
  type MetaFunction,
  redirect,
  useActionData,
  useSearchParams,
} from "react-router";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { safeRedirect } from "remix-utils/safe-redirect";
import { z } from "zod";
import { GeneralErrorBoundary } from "~/components/layout/error-boundary";
import { CheckboxField, ErrorList, Field } from "~/components/layout/forms";
import { StatusButton } from "~/components/layout/status-button";
import { auth } from "~/lib/auth/auth.server";
import { ProviderConnectionForm } from "~/lib/auth/connections";
import { validateCSRF } from "~/lib/csrf.server";
import { checkHoneypot } from "~/lib/honeypot.server";
import { useIsPending } from "~/lib/utils";
import { providerNames } from "~/lib/validations";
import { LoginFormSchema } from "~/lib/validations/user-validation";
import { requireAnonymousMiddleware } from "~/middleware.server";

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};

export const middleware = [requireAnonymousMiddleware];

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  await validateCSRF(formData, request.headers);
  checkHoneypot(formData);
  const submission = await parseWithZod(formData, {
    schema: (intent) =>
      LoginFormSchema.transform(async (data, ctx) => {
        if (intent !== null) return { ...data, session: null };

        const session = await auth.api.signInUsername({ body: { ...data } });
        if (!session) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid username or password",
          });
          return z.NEVER;
        }

        return { ...data, session };
      }),
    async: true,
  });

  if (submission.status !== "success" || !submission.value.session) {
    return data(
      { result: submission.reply({ hideFields: ["password"] }) },
      { status: submission.status === "error" ? 400 : 200 }
    );
  }

  return redirect(safeRedirect(submission.value.redirectTo));
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const isPending = useIsPending();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const [form, fields] = useForm({
    id: "login-form",
    constraint: getZodConstraint(LoginFormSchema),
    defaultValue: { redirectTo },
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: LoginFormSchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <div className="flex min-h-full flex-col justify-center pt-20 pb-32">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-h1">Welcome back!</h1>
          <p className="text-body-md text-muted-foreground">
            Please enter your details.
          </p>
        </div>

        <div>
          <div className="mx-auto w-full max-w-md px-8">
            <Form method="POST" {...getFormProps(form)}>
              <AuthenticityTokenInput />
              <HoneypotInputs />
              <Field
                errors={fields.username.errors}
                inputProps={{
                  ...getInputProps(fields.username, {
                    type: "text",
                  }),
                  autoFocus: true,
                  className: "lowercase",
                  autoComplete: "username",
                }}
                labelProps={{ children: "Username" }}
              />

              <Field
                errors={fields.password.errors}
                inputProps={{
                  ...getInputProps(fields.password, {
                    type: "password",
                  }),
                  autoComplete: "current-password",
                }}
                labelProps={{ children: "Password" }}
              />

              <div className="flex justify-between">
                <CheckboxField
                  buttonProps={getInputProps(fields.remember, {
                    type: "checkbox",
                  })}
                  errors={fields.remember.errors}
                  labelProps={{
                    htmlFor: fields.remember.id,
                    children: "Remember me",
                  }}
                />
                <div>
                  <Link
                    className="font-semibold text-body-xs"
                    to="/forgot-password"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <input
                {...getInputProps(fields.redirectTo, {
                  type: "hidden",
                })}
              />
              <ErrorList errors={form.errors} id={form.errorId} />

              <div className="flex items-center justify-between gap-6 pt-3">
                <StatusButton
                  className="w-full"
                  disabled={isPending}
                  status={isPending ? "pending" : (form.status ?? "idle")}
                  type="submit"
                >
                  Log in
                </StatusButton>
              </div>
            </Form>
            <ul className="mt-5 flex flex-col gap-5 border-border border-t-2 py-3">
              {providerNames.map((providerName) => (
                <li key={providerName}>
                  <ProviderConnectionForm
                    providerName={providerName}
                    redirectTo={redirectTo}
                    type="Login"
                  />
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-center gap-2 pt-6">
              <span className="text-muted-foreground">New here?</span>
              <Link
                to={
                  redirectTo
                    ? `/signup?${encodeURIComponent(redirectTo)}`
                    : "/signup"
                }
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const meta: MetaFunction = () => [{ title: "Login to Your Account" }];

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
