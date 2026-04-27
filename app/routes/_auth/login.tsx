import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { startAuthentication } from "@simplewebauthn/browser";
import { ShieldCheck } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { data, Form, Link, useNavigate, useSearchParams } from "react-router";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { z } from "zod";
import { GeneralErrorBoundary } from "~/components/layout/error-boundary";
import { CheckboxField, ErrorList, Field } from "~/components/layout/forms";
import { Spacer } from "~/components/layout/spacer";
import { StatusButton } from "~/components/layout/status-button";
import { login } from "~/lib/auth/auth.server";
import { ProviderConnectionForm } from "~/lib/auth/connections";
import { validateCSRF } from "~/lib/csrf.server.js";
import { checkHoneypot } from "~/lib/honeypot.server";
import { inngest } from "~/lib/inngest.server.js";
import { getErrorMessage, useIsPending } from "~/lib/utils";
import { providerNames } from "~/lib/validations";
import {
  PasswordSchema,
  UsernameSchema,
} from "~/lib/validations/user-validation";
import { requireAnonymousMiddleware } from "~/middleware.server.js";
import type { Route } from "./+types/login.ts";
import { handleNewSession } from "./login.server";

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};

const LoginFormSchema = z.object({
  username: UsernameSchema,
  password: PasswordSchema,
  redirectTo: z.string().optional(),
  remember: z.boolean().optional(),
});

const AuthenticationOptionsSchema = z.object({
  options: z.object({ challenge: z.string() }),
}) satisfies z.ZodType<{ options: PublicKeyCredentialRequestOptionsJSON }>;

export const middleware = [requireAnonymousMiddleware];

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  await validateCSRF(formData, request.headers);
  checkHoneypot(formData);
  const submission = await parseWithZod(formData, {
    schema: (intent) =>
      LoginFormSchema.transform(async (data, ctx) => {
        if (intent !== null) return { ...data, session: null };

        const session = await login(data);
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

  await inngest.send({
    name: "test/hello.world",
    data: {
      email: submission.value.username,
    },
  });
  const { session, remember, redirectTo } = submission.value;

  return handleNewSession({
    request,
    session,
    remember: remember ?? false,
    redirectTo,
  });
}

export default function LoginPage({ actionData }: Route.ComponentProps) {
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
        <Spacer size="xs" />

        <div>
          <div className="mx-auto w-full max-w-md px-8">
            <Form method="POST" {...getFormProps(form)}>
              {" "}
              <AuthenticityTokenInput />
              <HoneypotInputs />
              <Field
                errors={fields.username.errors}
                inputProps={{
                  ...getInputProps(fields.username, { type: "text" }),
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
                {...getInputProps(fields.redirectTo, { type: "hidden" })}
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
            <hr className="my-4" />
            <div className="flex flex-col gap-5">
              <PasskeyLogin
                redirectTo={redirectTo}
                remember={fields.remember.value === "on"}
              />
            </div>
            <hr className="my-4" />
            <ul className="flex flex-col gap-5">
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
                    ? `/signup?redirectTo=${encodeURIComponent(redirectTo)}`
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

const VerificationResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    location: z.string(),
  }),
  z.object({
    status: z.literal("error"),
    error: z.string(),
  }),
]);

function PasskeyLogin({
  redirectTo,
  remember,
}: {
  redirectTo: string | null;
  remember: boolean;
}) {
  const [isPending] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [passkeyMessage, setPasskeyMessage] = useOptimistic<string | null>(
    "Login with a passkey"
  );
  const navigate = useNavigate();

  async function handlePasskeyLogin() {
    try {
      setPasskeyMessage("Generating Authentication Options");
      // Get authentication options from the server
      const optionsResponse = await fetch("/webauthn/authentication");
      const json = await optionsResponse.json();
      const { options } = AuthenticationOptionsSchema.parse(json);

      setPasskeyMessage("Requesting your authorization");
      const authResponse = await startAuthentication({ optionsJSON: options });
      setPasskeyMessage("Verifying your passkey");

      // Verify the authentication with the server
      const verificationResponse = await fetch("/webauthn/authentication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authResponse, remember, redirectTo }),
      });

      const verificationJson = await verificationResponse.json().catch(() => ({
        status: "error",
        error: "Unknown error",
      }));

      const parsedResult =
        VerificationResponseSchema.safeParse(verificationJson);
      if (!parsedResult.success) {
        throw new Error(parsedResult.error.message);
      }
      if (parsedResult.data.status === "error") {
        throw new Error(parsedResult.data.error);
      }
      const { location } = parsedResult.data;

      setPasskeyMessage("You're logged in! Navigating...");
      await navigate(location ?? "/");
    } catch (e) {
      const errorMessage = getErrorMessage(e);
      setError(`Failed to authenticate with passkey: ${errorMessage}`);
    }
  }

  return (
    <form action={handlePasskeyLogin}>
      <StatusButton
        aria-describedby="passkey-login-button-error"
        className="w-full"
        disabled={isPending}
        id="passkey-login-button"
        status={isPending ? "pending" : error ? "error" : "idle"}
        type="submit"
      >
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck />
          <span>{passkeyMessage}</span>
        </span>
      </StatusButton>
      <div className="mt-2">
        <ErrorList errors={[error]} id="passkey-login-button-error" />
      </div>
    </form>
  );
}

export const meta: Route.MetaFunction = () => [
  { title: "Login to One Piece App" },
];

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
