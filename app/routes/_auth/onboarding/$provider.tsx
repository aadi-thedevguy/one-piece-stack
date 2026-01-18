import {
  getFormProps,
  getInputProps,
  type SubmissionResult,
  useForm,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  data,
  Form,
  type Params,
  redirect,
  useSearchParams,
} from "react-router";
// import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { safeRedirect } from "remix-utils/safe-redirect";
import { z } from "zod";
import { CheckboxField, ErrorList, Field } from "~/components/layout/forms";
import { Spacer } from "~/components/layout/spacer";
import { StatusButton } from "~/components/layout/status-button";
import {
  onboardingEmailSessionKey,
  prefilledProfileKey,
  providerIdKey,
  sessionKey,
} from "~/constants/keys";
import { signupWithConnection } from "~/lib/auth/auth.server";
import { authSessionStorage } from "~/lib/auth/session.server";
import { verifySessionStorage } from "~/lib/auth/verification.server";
// import { validateCSRF } from "~/lib/csrf.server";
import { prisma } from "~/lib/db.server";
import { redirectWithToast } from "~/lib/toast.server";
import { useIsPending } from "~/lib/utils";
import { ProviderNameSchema } from "~/lib/validations/index.js";
import { SignupFormSchema } from "~/lib/validations/user-validation";
import { requireAnonymousMiddleware } from "~/middleware.server";
import type { Route } from "./+types/$provider";

async function requireData({
  request,
  params,
}: {
  request: Request;
  params: Params;
}) {
  const verifySession = await verifySessionStorage.getSession(
    request.headers.get("cookie")
  );
  const email = verifySession.get(onboardingEmailSessionKey);
  const providerId = verifySession.get(providerIdKey);
  const result = z
    .object({
      email: z.string(),
      providerName: ProviderNameSchema,
      providerId: z.string().or(z.number()),
    })
    .safeParse({ email, providerName: params.provider, providerId });
  if (result.success) {
    return result.data;
  }
  console.error(result.error);
  throw redirect("/signup");
}

export const middleware = [requireAnonymousMiddleware];

export async function loader({ request, params }: Route.LoaderArgs) {
  const { email } = await requireData({ request, params });

  const verifySession = await verifySessionStorage.getSession(
    request.headers.get("cookie")
  );
  const prefilledProfile = verifySession.get(prefilledProfileKey);

  return {
    email,
    status: "idle",
    submission: {
      initialValue: prefilledProfile ?? {},
    } as SubmissionResult,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { email, providerId, providerName } = await requireData({
    request,
    params,
  });
  const formData = await request.formData();
  const verifySession = await verifySessionStorage.getSession(
    request.headers.get("cookie")
  );
  // await validateCSRF(formData, request.headers);
  const submission = await parseWithZod(formData, {
    schema: SignupFormSchema.superRefine(async (data, ctx) => {
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
    }).transform(async (data) => {
      const session = await signupWithConnection({
        ...data,
        email,
        providerId: String(providerId),
        providerName,
      });
      return { ...data, session };
    }),
    async: true,
  });

  if (submission.status !== "success") {
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
  { title: "Setup One Piece App Account" },
];

export default function OnboardingProviderRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const isPending = useIsPending();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const [form, fields] = useForm({
    id: "onboarding-provider-form",
    constraint: getZodConstraint(SignupFormSchema),
    lastResult: actionData?.result ?? loaderData.submission,
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
          {/* <AuthenticityTokenInput /> */}
          {fields.imageUrl.initialValue ? (
            <div className="mb-4 flex flex-col items-center justify-center gap-4">
              <img
                alt="Profile"
                className="size-24 rounded-full"
                height={96}
                src={fields.imageUrl.initialValue}
                width={96}
              />
              <p className="text-body-sm text-muted-foreground">
                You can change your photo later
              </p>
              <input {...getInputProps(fields.imageUrl, { type: "hidden" })} />
            </div>
          ) : null}
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
