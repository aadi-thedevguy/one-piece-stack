import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { CheckCheck, LockOpen, ShieldBan } from "lucide-react";
import { Link, redirect, useFetcher } from "react-router";
import { StatusButton } from "~/components/layout/status-button";
import { requireUserId } from "~/lib/auth/auth.server";
import { generateTOTP } from "~/lib/auth/totp.server";
import { prisma } from "~/lib/db.server";
import { twoFAVerificationType } from "./_layout";
import type { Route } from "./+types/index.ts";
import { twoFAVerifyVerificationType } from "./verify";

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const verification = await prisma.verification.findUnique({
    where: { target_type: { type: twoFAVerificationType, target: userId } },
    select: { id: true },
  });
  return { is2FAEnabled: Boolean(verification) };
}

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const { otp: _otp, ...config } = await generateTOTP();
  const verificationData = {
    ...config,
    type: twoFAVerifyVerificationType,
    target: userId,
  };
  await prisma.verification.upsert({
    where: {
      target_type: { target: userId, type: twoFAVerifyVerificationType },
    },
    create: verificationData,
    update: verificationData,
  });
  return redirect("/settings/profile/two-factor/verify");
}

export default function TwoFactorRoute({ loaderData }: Route.ComponentProps) {
  const enable2FAFetcher = useFetcher<typeof action>();

  return (
    <div className="flex flex-col gap-4">
      {loaderData.is2FAEnabled ? (
        <>
          <p className="flex items-center gap-2 text-lg">
            <CheckCheck className="h-4 w-4" />
            <span>You have enabled two-factor authentication.</span>
          </p>
          <Link to="disable">
            <ShieldBan className="h-4 w-4" />
            <span>Disable 2FA</span>
          </Link>
        </>
      ) : (
        <>
          <p className="flex items-center gap-2">
            <LockOpen className="h-4 w-4" />
            <span>You have not enabled two-factor authentication yet.</span>
          </p>
          <p className="text-sm">
            Two factor authentication adds an extra layer of security to your
            account. You will need to enter a code from an authenticator app
            like{" "}
            <a className="underline" href="https://1password.com/">
              1Password
            </a>{" "}
            to log in.
          </p>
          <enable2FAFetcher.Form method="POST">
            <StatusButton
              className="mx-auto"
              name="intent"
              status={enable2FAFetcher.state === "loading" ? "pending" : "idle"}
              type="submit"
              value="enable"
            >
              Enable 2FA
            </StatusButton>
          </enable2FAFetcher.Form>
        </>
      )}
    </div>
  );
}
