import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { invariantResponse } from "@epic-web/invariant";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { Mail } from "lucide-react";
import { data, Form, redirect } from "react-router";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { z } from "zod";
import { ErrorList, Field } from "~/components/layout/forms";
import { StatusButton } from "~/components/layout/status-button";
import { EmailChangeEmail } from "~/components/mails/EmailChangeEmail";
import { userIdContext } from "~/context";
import { verifySessionStorage } from "~/lib/auth/verification.server";
import { validateCSRF } from "~/lib/csrf.server.js";
import { prisma } from "~/lib/db.server";
import { sendEmail } from "~/lib/email.server";
import { useIsPending } from "~/lib/utils";
import { EmailSchema } from "~/lib/validations/user-validation";
import {
  prepareVerification,
  requireRecentVerification,
} from "~/routes/_auth/verify.server";
import type { BreadcrumbHandle } from "./_layout";
import type { Route } from "./+types/change-email.ts";

export const handle: BreadcrumbHandle & SEOHandle = {
  breadcrumb: (
    <div className="flex items-center gap-2">
      <Mail className="h-4 w-4" />
      <span>Change Email</span>
    </div>
  ),
  getSitemapEntries: () => null,
};

export const newEmailAddressSessionKey = "new-email-address";

const ChangeEmailSchema = z.object({
  email: EmailSchema,
});

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireRecentVerification(request);
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) {
    const params = new URLSearchParams({ redirectTo: request.url });
    throw redirect(`/login?${params}`);
  }
  return { user };
}

export async function action({ context, request }: Route.ActionArgs) {
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });
  const formData = await request.formData();
  await validateCSRF(formData, request.headers);
  const submission = await parseWithZod(formData, {
    schema: ChangeEmailSchema.superRefine(async (data, ctx) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        ctx.addIssue({
          path: ["email"],
          code: z.ZodIssueCode.custom,
          message: "This email is already in use.",
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
  const { otp, redirectTo, verifyUrl } = await prepareVerification({
    period: 10 * 60,
    request,
    target: userId,
    type: "change-email",
  });

  const response = await sendEmail({
    to: submission.value.email,
    subject: "One Piece App - Email Change Verification",
    react: <EmailChangeEmail otp={otp} verifyUrl={verifyUrl.toString()} />,
  });

  if (response.status === "success") {
    const verifySession = await verifySessionStorage.getSession();
    verifySession.set(newEmailAddressSessionKey, submission.value.email);
    return redirect(redirectTo.toString(), {
      headers: {
        "set-cookie": await verifySessionStorage.commitSession(verifySession),
      },
    });
  }
  return data(
    { result: submission.reply({ formErrors: [response.error.message] }) },
    { status: 500 }
  );
}

export default function ChangeEmailIndex({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [form, fields] = useForm({
    id: "change-email-form",
    constraint: getZodConstraint(ChangeEmailSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: ChangeEmailSchema });
    },
  });

  const isPending = useIsPending();
  return (
    <div>
      <h1 className="text-h1">Change Email</h1>
      <p>You will receive an email at the new email address to confirm.</p>
      <p>
        An email notice will also be sent to your old address{" "}
        {loaderData.user.email}.
      </p>
      <div className="mx-auto mt-5 max-w-sm">
        <Form method="POST" {...getFormProps(form)}>
          <AuthenticityTokenInput />
          <Field
            errors={fields.email.errors}
            inputProps={{
              ...getInputProps(fields.email, { type: "email" }),
              autoComplete: "email",
            }}
            labelProps={{ children: "New Email" }}
          />
          <ErrorList errors={form.errors} id={form.errorId} />
          <div>
            <StatusButton
              status={isPending ? "pending" : (form.status ?? "idle")}
            >
              Send Confirmation
            </StatusButton>
          </div>
        </Form>
      </div>
    </div>
  );
}
