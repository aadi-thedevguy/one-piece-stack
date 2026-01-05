import DodoPayments from "dodopayments";
import type { ProductCreateParams } from "dodopayments/resources/index";
import { prisma } from "./db.server";

// This will be initialized only once per server instance.
export const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: "test_mode",
});

export async function getSubscriptionByUserId(userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
    include: {
      plan: true,
      price: true,
    },
  });
}

/**
 * Retrieves or creates a product on Dodo Payments.
 */
export async function getOrCreateProduct(productData: ProductCreateParams) {
  console.log(`Checking for existing product: "${productData.name}"...`);
  for await (const productListResponse of dodoClient.products.list()) {
    if (productListResponse.name === productData.name) {
      console.log(
        `Product "${productData.name}" already exists on Dodo Payments. Re-using.`
      );
      return productListResponse;
    }
  }

  console.log(`Creating product "${productData.name}" on Dodo Payments...`);
  return await dodoClient.products.create(productData);
}

/**
 * Retrieves or creates a customer on Dodo Payments.
 */
export async function getOrCreateCustomer(email: string, name: string) {
  for await (const customer of dodoClient.customers.list({ email })) {
    if (customer) {
      console.log(`Customer with email "${email}" already exists. Re-using.`);
      return customer;
    }
  }

  console.log(`Creating customer for "${email}" on Dodo Payments...`);
  return await dodoClient.customers.create({ email, name });
}

export async function updateSubscription(
  subscriptionId: string,
  newProductId: string
) {
  return dodoClient.subscriptions.changePlan(subscriptionId, {
    product_id: newProductId,
    proration_billing_mode: "prorated_immediately",
    quantity: 0,
  });
}

export async function cancelSubscription(subscriptionId: string) {
  return dodoClient.subscriptions.update(subscriptionId, {
    cancel_at_next_billing_date: true,
  });
}
