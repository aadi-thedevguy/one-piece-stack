import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import {
  type ActionFunctionArgs,
  data,
  Form,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
  useActionData,
  useLoaderData,
} from "react-router";
import z from "zod";
import { GeneralErrorBoundary } from "~/components/layout/error-boundary";
import { ErrorList, Field } from "~/components/layout/forms";
import { StatusButton } from "~/components/layout/status-button";
import { auth } from "~/lib/auth/auth.server";
import { useIsPending } from "~/lib/utils";
import { PasswordAndConfirmPasswordSchema } from "~/lib/validations/user-validation";

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};

const ResetPasswordSchema = PasswordAndConfirmPasswordSchema.and(
  z.object({
    token: z.string().min(5),
  })
);

async function requireResetPasswordUsername(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  const resetPasswordUsername = session?.user.username;
  if (typeof resetPasswordUsername !== "string" || !resetPasswordUsername) {
    throw redirect("/login");
  }
  return resetPasswordUsername;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  if (typeof params.token !== "string" || !params.token) {
    throw redirect("/auth/forgot-password");
  }
  const resetPasswordUsername = await requireResetPasswordUsername(request);

  return data({ resetPasswordUsername, token: params.token });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireResetPasswordUsername(request);
  const formData = await request.formData();
  const submission = parseWithZod(formData, {
    schema: ResetPasswordSchema,
  });
  if (submission.status !== "success") {
    return data(
      { result: submission.reply() },
      { status: submission.status === "error" ? 400 : 200 }
    );
  }
  const { password, token } = submission.value;

  const { status } = await auth.api.resetPassword({
    body: {
      newPassword: password,
      token,
    },
  });

  if (status) {
    await auth.api.signOut({
      headers: request.headers,
    });
  } else {
    return data(
      {
        result: submission.reply({
          formErrors: ["Unable to reset password, Please try later"],
        }),
      },
      {
        status: 500,
      }
    );
  }
}

export const meta: MetaFunction = () => [
  { title: "Reset Password | One Piece Stack" },
];

export default function ResetPasswordPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
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
          Hi, {data.resetPasswordUsername}. No worries. It happens all the time.
        </p>
      </div>
      <div className="mx-auto mt-16 min-w-full max-w-sm sm:min-w-[368px]">
        <Form method="POST" {...getFormProps(form)}>
          <Field
            errors={fields.password.errors}
            inputProps={{
              ...getInputProps(fields.password, {
                type: "password",
              }),
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
              ...getInputProps(fields.confirmPassword, {
                type: "password",
              }),
              autoComplete: "new-password",
            }}
            labelProps={{
              htmlFor: fields.confirmPassword.id,
              children: "Confirm Password",
            }}
          />

          {data.token && (
            <input {...getInputProps(fields.token, { type: "hidden" })} />
          )}

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
