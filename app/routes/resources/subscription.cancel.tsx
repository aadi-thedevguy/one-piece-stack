import { invariantResponse } from "@epic-web/invariant";
import type { ActionFunctionArgs } from "react-router";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db.server";
import { cancelSubscription } from "~/lib/payment.server";
import { redirectWithToast } from "~/lib/toast.server";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const targetUserId = (formData.get("userId") as string) || userId;

  // Check permissions if cancelling for another user
  if (targetUserId !== userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: { select: { name: true } } },
    });
    const isAdmin = user?.roles.some((role) => role.name === "admin");
    invariantResponse(isAdmin, "Forbidden", { status: 403 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: targetUserId },
  });

  if (!subscription) {
    return redirectWithToast(request.headers.get("Referer") || "/", {
      type: "error",
      title: "Error",
      description: "No active subscription found.",
    });
  }

  // Mark who cancelled it before calling the provider
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      cancelledBy: targetUserId === userId ? "user" : "admin",
    },
  });

  // Call payment provider
  await cancelSubscription(subscription.id);

  return redirectWithToast(request.headers.get("Referer") || "/", {
    type: "success",
    title: "Success",
    description: "Subscription cancellation initiated.",
  });
}
