import type { Payment as BasePayment } from "dodopayments/resources/payments";
import { type ActionFunctionArgs, data } from "react-router";
import { Webhook } from "standardwebhooks";
import { SubscriptionEmail } from "~/components/mails/subscription-email";
import { prisma } from "~/lib/db.server";
import { sendEmail } from "~/lib/email.server";
import { dodoClient } from "~/lib/payment.server";
import { DodoSubscriptionWebhookSchema } from "~/lib/validations";

const dodoWebhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
type Payment = BasePayment & { payload_type: string };
interface WebhookPayload {
  data: Payment;
  type: string;
}

async function getDodoEvent(request: Request) {
  if (!dodoWebhookSecret) {
    throw new Error("Dodo Payments webhook secret not configured");
  }

  const webhookHeaders = {
    "webhook-id": request.headers.get("webhook-id") || "",
    "webhook-signature": request.headers.get("webhook-signature") || "",
    "webhook-timestamp": request.headers.get("webhook-timestamp") || "",
  };
  const payload = await request.text();
  const webhook = new Webhook(dodoWebhookSecret);

  await webhook.verify(payload, webhookHeaders);
  console.log("✅ Webhook Verified Successfully");

  const event = JSON.parse(payload) as WebhookPayload;
  console.log("📥 Received Webhook Type:", event.type);
  return event;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ message: "Method not allowed" }, { status: 405 });
  }

  const event = await getDodoEvent(request);

  try {
    switch (event.type) {
      /**
       * Occurs when a subscription is created, updated, or plan changed.
       */
      case "subscription.created":
      case "subscription.updated":
      case "subscription.plan_changed": {
        const { data: subscriptionData, error } =
          DodoSubscriptionWebhookSchema.safeParse(event.data);
        if (error) {
          return data(
            { message: "Invalid payload", errors: error.errors },
            400
          );
        }
        const { customer, subscription_id: subscriptionId } = subscriptionData;

        const user = await prisma.user.findFirst({
          where: { customerId: customer.customer_id },
          select: { id: true, email: true, name: true },
        });
        if (!user) throw new Error("User not found for customer ID.");

        const dodoSubscription =
          await dodoClient.subscriptions.retrieve(subscriptionId);

        // Fetch Price and Plan to get internal IDs and interval
        const price = await prisma.price.findUnique({
          where: { priceID: dodoSubscription.product_id },
          include: { plan: true },
        });

        if (!price?.plan) {
          throw new Error(
            "Price or Plan not found for the subscription product."
          );
        }

        await prisma.subscription.upsert({
          where: { userId: user.id },
          create: {
            id: dodoSubscription.subscription_id,
            planId: price.plan.id,
            userId: user.id,
            interval: price.interval,
            priceId: price.id,
            status: dodoSubscription.status,
            currentPeriodStart: new Date(dodoSubscription.created_at),
            currentPeriodEnd: new Date(dodoSubscription.next_billing_date),
            cancelAtPeriodEnd: dodoSubscription.cancel_at_next_billing_date,
          },
          update: {
            id: dodoSubscription.subscription_id,
            planId: price.plan.id,
            interval: price.interval,
            priceId: price.id,
            status: dodoSubscription.status,
            currentPeriodStart: new Date(dodoSubscription.created_at),
            currentPeriodEnd: new Date(dodoSubscription.next_billing_date),
            cancelAtPeriodEnd: dodoSubscription.cancel_at_next_billing_date,
          },
        });

        // Send appropriate email based on event type
        if (event.type === "subscription.created") {
          await sendEmail({
            to: user.email,
            subject: "Subscription Confirmation",
            react: (
              <SubscriptionEmail
                action="created"
                planName={price.plan?.name}
                userFirstName={user.name ?? "there"}
              />
            ),
          });
        } else {
          await sendEmail({
            to: user.email,
            subject: "Your Subscription Has Been Updated",
            react: (
              <SubscriptionEmail
                action="updated"
                planName={price.plan?.name}
                userFirstName={user.name ?? "there"}
              />
            ),
          });
        }

        return data({ message: "Success" });
      }

      /**
       * Occurs whenever a customer’s subscription ends.
       */
      case "subscription.cancelled": {
        const { data: subscriptionData, error } =
          DodoSubscriptionWebhookSchema.safeParse(event.data);
        if (error) {
          return data(
            { message: "Invalid payload", errors: error.errors },
            400
          );
        }
        const { subscription_id: subscriptionId } = subscriptionData;

        const dbSubscription = await prisma.subscription.findUnique({
          where: { id: subscriptionId },
          include: { user: { select: { email: true, name: true } } },
        });

        if (dbSubscription?.user) {
          await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
              status: "cancelled",
              cancelledAt: new Date(),
            },
          });

          await sendEmail({
            to: dbSubscription.user.email,
            subject: "Your Subscription Has Been Cancelled",
            react: (
              <SubscriptionEmail
                action="cancelled"
                userFirstName={dbSubscription.user.name ?? "there"}
              />
            ),
          });
        }

        return data({ message: "Success" });
      }
      default:
        console.log("Unhandled event type: $event.type");
        return data({ message: "Unhandled event type" });
    }
  } catch (err: unknown) {
    console.error("Webhook processing error:", err);
    return data({ message: "An error occurred" }, 500);
  }
}
