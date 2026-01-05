import type { Payment as BasePayment } from "dodopayments/resources/payments";
import { type ActionFunctionArgs, data } from "react-router";
import { Webhook } from "standardwebhooks";
import { SubscriptionEmail } from "~/components/mails/SubscriptionEmail";
import { prisma } from "~/lib/db.server";
import { sendEmail } from "~/lib/email.server";
import { dodoClient } from "~/lib/payment.server";
import { DodoSubscriptionWebhookSchema } from "~/lib/validations";

const dodoWebhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
type Payment = BasePayment & { payload_type: string };
type WebhookPayload = {
  type: string;
  data: Payment;
};

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
       * Occurs when a subscription is created.
       */
      case "subscription.created": {
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
        const plan = await prisma.plan.findFirst({
          where: { prices: { some: { priceID: dodoSubscription.product_id } } },
        });

        await prisma.subscription.update({
          where: { userId: user.id },
          data: {
            id: dodoSubscription.subscription_id,
            planId: plan?.id,
            priceId: dodoSubscription.product_id,
            status: dodoSubscription.status,
            currentPeriodStart: new Date(dodoSubscription.created_at).getTime(),
            currentPeriodEnd: new Date(
              dodoSubscription.next_billing_date
            ).getTime(),
            cancelAtPeriodEnd: dodoSubscription.cancel_at_next_billing_date,
          },
        });

        await sendEmail({
          to: user.email,
          subject: "Subscription Confirmation",
          // text: "Your subscription has been confirmed.",
          // html: await SubscriptionEmailHtml({
          //   action: "created",
          //   planName: plan?.name,
          //   userFirstName: user.name ?? "there",
          // }),
          react: (
            <SubscriptionEmail
              action="created"
              planName={plan?.name}
              userFirstName={user.name ?? "there"}
            />
          ),
        });

        return data({ message: "Success" });
      }

      /**
       * Occurs when a subscription has been updated.
       */
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
        const plan = await prisma.plan.findFirst({
          where: { prices: { some: { priceID: dodoSubscription.product_id } } },
        });

        await prisma.subscription.update({
          where: { userId: user.id },
          data: {
            id: dodoSubscription.subscription_id,
            planId: plan?.id,
            priceId: dodoSubscription.product_id,
            status: dodoSubscription.status,
            currentPeriodStart: new Date(dodoSubscription.created_at).getTime(),
            currentPeriodEnd: new Date(
              dodoSubscription.next_billing_date
            ).getTime(),
            cancelAtPeriodEnd: dodoSubscription.cancel_at_next_billing_date,
          },
        });

        await sendEmail({
          to: user.email,
          subject: "Your Subscription Has Been Updated",
          // text: "Your subscription has been updated.",
          // html: await SubscriptionEmailHtml({
          //   action: "updated",
          //   planName: plan?.name,
          //   userFirstName: user.name ?? "there",
          // }),
          react: (
            <SubscriptionEmail
              action="updated"
              planName={plan?.name}
              userFirstName={user.name ?? "there"}
            />
          ),
        });

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
          await prisma.subscription.delete({ where: { id: subscriptionId } });

          await sendEmail({
            to: dbSubscription.user.email,
            subject: "Your Subscription Has Been Cancelled",
            // text: "Your subscription has been cancelled.",
            // html: await SubscriptionEmailHtml({
            //   action: "cancelled",
            //   userFirstName: dbSubscription.user.name ?? "there",
            // }),
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

// export default function Route() {
//   return null;
// }
