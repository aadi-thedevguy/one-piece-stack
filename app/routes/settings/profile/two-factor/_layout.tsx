import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { ShieldCheck } from "lucide-react";
import { Outlet } from "react-router";
import type { VerificationTypes } from "~/lib/validations";
import { requireUserMiddleware } from "~/middleware.server";
import type { BreadcrumbHandle } from "../../profile/_layout";

export const handle: BreadcrumbHandle & SEOHandle = {
  breadcrumb: (
    <div className="flex items-center gap-2">
      <ShieldCheck className="h-4 w-4" />
      <span>2FA</span>
    </div>
  ),
  getSitemapEntries: () => null,
};

export const middleware = [requireUserMiddleware];

export const twoFAVerificationType = "2fa" satisfies VerificationTypes;

export default function TwoFactorRoute() {
  return <Outlet />;
}
