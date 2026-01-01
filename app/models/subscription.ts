import { prisma } from "~/lib/db.server";

export async function getSubscriptionByUserId(userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
    include: {
      plan: true,
      price: true,
    },
  });
}
