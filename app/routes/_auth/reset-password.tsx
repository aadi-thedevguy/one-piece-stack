import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { data, Form, redirect } from "react-router";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { GeneralErrorBoundary } from "~/components/layout/error-boundary";
import { ErrorList, Field } from "~/components/layout/forms";
import { StatusButton } from "~/components/layout/status-button";
import {
  checkIsCommonPassword,
  resetUserPassword,
} from "~/lib/auth/auth.server";
import { verifySessionStorage } from "~/lib/auth/verification.server";
import { validateCSRF } from "~/lib/csrf.server.js";
import { useIsPending } from "~/lib/utils";
import { PasswordAndConfirmPasswordSchema } from "~/lib/validations/user-validation";
import { requireAnonymousMiddleware } from "~/middleware.server.js";
import type { Route } from "./+types/reset-password.ts";

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};

export const middleware = [requireAnonymousMiddleware];

export const resetPasswordUsernameSessionKey = "resetPasswordUsername";

const ResetPasswordSchema = PasswordAndConfirmPasswordSchema;

async function requireResetPasswordUsername(request: Request) {
  const verifySession = await verifySessionStorage.getSession(
    request.headers.get("cookie")
  );
  const resetPasswordUsername = verifySession.get(
    resetPasswordUsernameSessionKey
  );
  if (typeof resetPasswordUsername !== "string" || !resetPasswordUsername) {
    throw redirect("/login");
  }
  return resetPasswordUsername;
}

export async function loader({ request }: Route.LoaderArgs) {
  const resetPasswordUsername = await requireResetPasswordUsername(request);
  return { resetPasswordUsername };
}

export async function action({ request }: Route.ActionArgs) {
  const resetPasswordUsername = await requireResetPasswordUsername(request);
  const formData = await request.formData();
  await validateCSRF(formData, request.headers);
  const submission = await parseWithZod(formData, {
    schema: ResetPasswordSchema.superRefine(async ({ password }, ctx) => {
      const isCommonPassword = await checkIsCommonPassword(password);
      if (isCommonPassword) {
        ctx.addIssue({
          path: ["password"],
          code: "custom",
          message: "Password is too common",
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
  const { password } = submission.value;

  await resetUserPassword({ username: resetPasswordUsername, password });
  const verifySession = await verifySessionStorage.getSession();
  return redirect("/login", {
    headers: {
      "set-cookie": await verifySessionStorage.destroySession(verifySession),
    },
  });
}

export const meta: Route.MetaFunction = () => [
  { title: "Reset Password | One Piece App" },
];

export default function ResetPasswordPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: "reset-password",
    constraint: getZodConstraint(ResetPasswordSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ResetPasswordSchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <div className="container flex flex-col justify-center pt-20 pb-32">
      <div className="text-center">
        <h1 className="text-h1">Password Reset</h1>
        <p className="mt-3 text-body-md text-muted-foreground">
          Hi, {loaderData.resetPasswordUsername}. No worries. It happens all the
          time.
        </p>
      </div>
      <div className="mx-auto mt-16 min-w-full max-w-sm sm:min-w-92">
        <Form method="POST" {...getFormProps(form)}>
          {" "}
          <AuthenticityTokenInput />
          <Field
            errors={fields.password.errors}
            inputProps={{
              ...getInputProps(fields.password, { type: "password" }),
              autoComplete: "new-password",
              autoFocus: true,
            }}
            labelProps={{
              htmlFor: fields.password.id,
              children: "New Password",
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
            }}
          />
          <ErrorList errors={form.errors} id={form.errorId} />
          <StatusButton
            className="w-full"
            disabled={isPending}
            status={isPending ? "pending" : (form.status ?? "idle")}
            type="submit"
          >
            Reset password
          </StatusButton>
        </Form>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
