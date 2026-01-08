import { type ActionFunctionArgs, redirect } from "react-router";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db.server";
import { cancelSubscription } from "~/lib/payment.server";
import { redirectWithToast } from "~/lib/toast.server";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  // Verify admin
  const adminUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: { select: { name: true } } },
  });
  const isAdmin = adminUser?.roles.some((role) => role.name === "admin");
  if (!isAdmin) {
    throw new Response("Unauthorized", { status: 403 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");
  const targetUserId = formData.get("userId") as string;

  if (!targetUserId) {
    throw new Response("Missing user ID", { status: 400 });
  }

  if (intent === "ban") {
    // 1. Set user as inactive
    await prisma.user.update({
      where: { id: targetUserId },
      data: { active: false },
    });

    // 2. Cancel subscription if exists
    const subscription = await prisma.subscription.findUnique({
      where: { userId: targetUserId },
    });

    if (subscription && subscription.status === "active") {
      await cancelSubscription(subscription.id);
    }

    return redirectWithToast(
      request.headers.get("Referer") || "/admin/dashboard",
      {
        type: "success",
        title: "User Banned",
        description: "User has been deactivated and subscription cancelled.",
      }
    );
  }

  if (intent === "unban") {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { active: true },
    });

    return redirectWithToast(
      request.headers.get("Referer") || "/admin/dashboard",
      {
        type: "success",
        title: "User Unbanned",
        description: "User has been reactivated.",
      }
    );
  }

  return redirect(request.headers.get("Referer") || "/admin/dashboard");
}
