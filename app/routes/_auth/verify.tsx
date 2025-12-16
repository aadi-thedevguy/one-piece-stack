import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import {
  type ActionFunctionArgs,
  Form,
  useActionData,
  useSearchParams,
} from "react-router";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { GeneralErrorBoundary } from "~/components/layout/error-boundary";
import { ErrorList, OTPField } from "~/components/layout/forms";
import { StatusButton } from "~/components/layout/status-button";
import { validateCSRF } from "~/lib/csrf.server";
import { checkHoneypot } from "~/lib/honeypot.server";
import { useIsPending } from "~/lib/utils";
import {
  codeQueryParam,
  redirectToQueryParam,
  targetQueryParam,
  typeQueryParam,
  VerificationTypeSchema,
  type VerificationTypes,
  VerifySchema,
} from "~/lib/validations";

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  await validateCSRF(formData, request.headers);
  checkHoneypot(formData);
  // return validateRequest(request, formData);
}

export default function VerifyRoute() {
  const [searchParams] = useSearchParams();
  const isPending = useIsPending();
  const actionData = useActionData<typeof action>();
  const parseWithZoddType = VerificationTypeSchema.safeParse(
    searchParams.get(typeQueryParam)
  );
  const type = parseWithZoddType.success ? parseWithZoddType.data : null;

  const checkEmail = (
    <>
      <h1 className="text-h1">Check your email</h1>
      <p className="mt-3 text-body-md text-muted-foreground">
        We&apos;ve sent you a code to verify your email address.
      </p>
    </>
  );

  const headings: Record<VerificationTypes, React.ReactNode> = {
    onboarding: checkEmail,
    "reset-password": checkEmail,
    "change-email": checkEmail,
  };

  const [form, fields] = useForm({
    id: "verify-form",
    constraint: getZodConstraint(VerifySchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: VerifySchema });
    },
    defaultValue: {
      code: searchParams.get(codeQueryParam),
      type,
      target: searchParams.get(targetQueryParam),
      redirectTo: searchParams.get(redirectToQueryParam),
    },
  });

  return (
    <main className="container flex flex-col justify-center pt-20 pb-32">
      <div className="text-center">
        {type ? headings[type] : "Invalid Verification Type"}
      </div>

      <div className="mx-auto flex w-72 max-w-full flex-col justify-center gap-1">
        <div>
          <ErrorList errors={form.errors} id={form.errorId} />
        </div>
        <div className="flex w-full gap-2">
          <Form method="POST" {...getFormProps(form)} className="flex-1">
            <AuthenticityTokenInput />
            <HoneypotInputs />
            <div className="flex items-center justify-center">
              <OTPField
                errors={fields[codeQueryParam].errors}
                inputProps={{
                  ...getInputProps(fields[codeQueryParam], {
                    type: "text",
                  }),
                  autoComplete: "one-time-code",
                  autoFocus: true,
                }}
                labelProps={{
                  htmlFor: fields[codeQueryParam].id,
                  children: "Code",
                }}
              />
            </div>
            <input
              {...getInputProps(fields[typeQueryParam], {
                type: "hidden",
              })}
            />
            <input
              {...getInputProps(fields[targetQueryParam], {
                type: "hidden",
              })}
            />
            <input
              {...getInputProps(fields[redirectToQueryParam], {
                type: "hidden",
              })}
            />
            <StatusButton
              className="w-full"
              disabled={isPending}
              status={isPending ? "pending" : (form.status ?? "idle")}
              type="submit"
            >
              Submit
            </StatusButton>
          </Form>
        </div>
      </div>
    </main>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
