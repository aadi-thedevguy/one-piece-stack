import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { ShieldBan } from "lucide-react";
import { useFetcher } from "react-router";
import { StatusButton } from "~/components/layout/status-button";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db.server";
import { redirectWithToast } from "~/lib/toast.server";
import { useDoubleCheck } from "~/lib/utils";
import { requireRecentVerification } from "~/routes/_auth/verify.server";
import type { BreadcrumbHandle } from "../../profile/_layout";
import { twoFAVerificationType } from "./_layout";
import type { Route } from "./+types/disable";

export const handle: BreadcrumbHandle & SEOHandle = {
  breadcrumb: (
    <div className="flex items-center gap-2">
      <ShieldBan className="h-4 w-4" />
      <span>Disable</span>
    </div>
  ),
  getSitemapEntries: () => null,
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireRecentVerification(request);
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  await requireRecentVerification(request);
  const userId = await requireUserId(request);
  await prisma.verification.delete({
    where: { target_type: { target: userId, type: twoFAVerificationType } },
  });
  return redirectWithToast("/settings/profile/two-factor", {
    title: "2FA Disabled",
    description: "Two factor authentication has been disabled.",
  });
}

export default function TwoFactorDisableRoute() {
  const disable2FAFetcher = useFetcher<typeof action>();
  const dc = useDoubleCheck();

  return (
    <div className="mx-auto max-w-sm">
      <disable2FAFetcher.Form method="POST">
        <p>
          Disabling two factor authentication is not recommended. However, if
          you would like to do so, click here:
        </p>
        <StatusButton
          status={disable2FAFetcher.state === "loading" ? "pending" : "idle"}
          variant="destructive"
          {...dc.getButtonProps({
            className: "mx-auto",
            name: "intent",
            value: "disable",
            type: "submit",
          })}
        >
          {dc.doubleCheck ? "Are you sure?" : "Disable 2FA"}
        </StatusButton>
      </disable2FAFetcher.Form>
    </div>
  );
}
