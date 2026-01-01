import "dotenv/config";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { CURRENCIES, INTERVALS, PLANS, PRICING_PLANS } from "~/constants/index";
import { prisma } from "~/lib/db.server";
import { dodoClient } from "~/lib/payment.server";

function createPassword(password: string = faker.internet.password()) {
  return {
    hash: bcrypt.hashSync(password, 10),
  };
}

async function seed() {
  console.log("🌱 Seeding...");
  console.time("🌱 Database has been seeded");

  console.time("🧹 Cleaning up the database...");
  await Promise.all([
    prisma.user.deleteMany(),
    prisma.role.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.note.deleteMany(),
    prisma.connection.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.session.deleteMany(),
    prisma.password.deleteMany(),
    prisma.userImage.deleteMany(),
    prisma.plan.deleteMany(),
    prisma.price.deleteMany(),
    prisma.subscription.deleteMany(),
  ]);
  console.timeEnd("🧹 Cleaned up the database...");

  console.time("👑 Creating roles...");
  const adminRole = await prisma.role.create({
    data: {
      name: "admin",
      permissions: {
        connect: await prisma.permission.findMany({
          select: { id: true },
          where: { access: "any" },
        }),
      },
    },
  });
  console.log("Admin role created:", adminRole.name);

  const userRole = await prisma.role.create({
    data: {
      name: "user",
    },
  });
  console.log("User role created:", userRole.name);
  console.timeEnd("👑 Created roles...");

  console.time("🐨 Creating admin user...");

  let adminUser = await prisma.user.create({
    select: { id: true, email: true, name: true },
    data: {
      email: "thedevguy99@gmail.com",
      username: "thedevguy",
      name: "Aditya",

      password: { create: createPassword("password") },
      roles: { connect: [{ name: "admin" }, { name: "user" }] },
    },
  });

  await prisma.userImage.create({
    data: {
      userId: adminUser.id,
      objectKey: "icon.png",
    },
  });
  console.timeEnd("🐨 Created admin user");

  let starterPriceId: string | undefined;
  let starterPlanDbId: string | undefined;
  let starterPriceDbId: string | undefined;

  console.time("💳 Creating plans...");
  for (const planKey of Object.keys(PRICING_PLANS)) {
    const plan = PRICING_PLANS[planKey as keyof typeof PRICING_PLANS];

    // Create the Plan in DB
    const createdPlan = await prisma.plan.create({
      data: {
        planID: plan.id, // Keeping the slug (e.g. "starter") as the Plan ID
        name: plan.name,
        description: plan.description,
        isPopular: plan.isPopular,
        features: {
          create: plan.features.map((f) => ({ description: f })),
        },
      },
    });

    for (const interval of Object.values(INTERVALS)) {
      // Check if prices exist for this interval
      if (plan.prices[interval]) {
        // Unique currencies to avoid duplicates
        const currencies = Array.from(new Set(Object.values(CURRENCIES)));

        for (const currency of currencies) {
          const amount = plan.prices[interval][currency];
          if (amount) {
            let priceID = `price_${plan.id}_${interval}_${currency}`;

            // Dodo Product = Plan + Price configuration
            const productName = `${plan.name} - ${interval}`;
            const dodoProduct = await dodoClient.products.create({
              name: productName,
              description: plan.description,
              tax_category: "digital_products",
              price: {
                type: "recurring_price",
                price: amount,
                currency,
                payment_frequency_interval: interval,
                payment_frequency_count: 1,
                subscription_period_count: 1,
                subscription_period_interval: interval,
                discount: 0,
                purchasing_power_parity: true,
              },
            });
            priceID = dodoProduct.product_id;
            console.log(`Created Dodo Product: ${productName} (${priceID})`);

            const createdPrice = await prisma.price.create({
              data: {
                priceID, // This maps to Dodo Product ID
                planId: createdPlan.id,
                amount,
                currency,
                interval,
              },
            });

            // Capture Starter Price ID (USD, Month)
            if (
              plan.id === PLANS.STARTER &&
              interval === INTERVALS.MONTH &&
              currency === CURRENCIES.USD
            ) {
              starterPriceId = priceID;
              starterPlanDbId = createdPlan.id;
              starterPriceDbId = createdPrice.id;
            }
          }
        }
      }
    }
  }
  console.timeEnd("💳 Creating plans...");

  // Create Subscription for Admin
  if (starterPriceId && starterPlanDbId && starterPriceDbId) {
    console.time("✨ Creating admin subscription...");
    // 1. Create Customer
    const customer = await dodoClient.customers.create({
      email: adminUser.email,
      name: adminUser.name as string,
    });
    console.log(`Created Dodo Customer: ${customer.customer_id}`);

    // Update User with Customer ID
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: { customerId: customer.customer_id },
    });

    // 2. Create Subscription
    const subscription = await dodoClient.subscriptions.create({
      billing: { country: "US" }, // Default country
      customer: { customer_id: customer.customer_id },
      product_id: starterPriceId,
      quantity: 1,
    });
    console.log(`Created Dodo Subscription: ${subscription.subscription_id}`);

    // 3. Create Subscription in DB
    await prisma.subscription.create({
      data: {
        subscriptionID: subscription.subscription_id,
        userId: adminUser.id,
        planId: starterPlanDbId,
        priceId: starterPriceDbId,
        interval: "month",
        status: "active",
        currentPeriodStart: Math.floor(Date.now() / 1000),
        currentPeriodEnd: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // approx 1 month
        cancelAtPeriodEnd: false,
      },
    });
    console.log("Synced Admin Subscription to DB.");

    console.timeEnd("✨ Creating admin subscription...");
  }

  console.timeEnd("🌱 Database has been seeded");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
