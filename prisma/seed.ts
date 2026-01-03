import "dotenv/config";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { CURRENCIES, INTERVALS, PLANS, PRICING_PLANS } from "~/constants/index";
import { prisma } from "~/lib/db.server";
import { getOrCreateCustomer, getOrCreateProduct } from "~/lib/payment.server";

// Helper function to create a password hash
function createPassword(password: string = faker.internet.password()) {
  return {
    hash: bcrypt.hashSync(password, 10),
  };
}

async function createPlansAndPrices() {
  console.time("💳 Creating plans...");

  let starterPriceId: string | undefined;
  let starterPlanDbId: string | undefined;
  let starterPriceDbId: string | undefined;

  for (const planKey of Object.keys(PRICING_PLANS)) {
    const plan = PRICING_PLANS[planKey as keyof typeof PRICING_PLANS];

    const createdPlan = await prisma.plan.create({
      data: {
        planID: plan.id,
        name: plan.name,
        description: plan.description,
        isPopular: plan.isPopular,
        features: {
          create: plan.features.map((f) => ({ description: f })),
        },
      },
    });

    for (const interval of Object.values(INTERVALS)) {
      if (plan.prices[interval]) {
        const currencies = Array.from(new Set(Object.values(CURRENCIES)));
        for (const currency of currencies) {
          const amount =
            plan.prices[interval][
              currency as keyof (typeof plan.prices)[typeof interval]
            ];
          if (typeof amount === "number" && amount > 0) {
            const productName = `${plan.name} - ${interval} - ${currency}`;
            const dodoProduct = await getOrCreateProduct({
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

            const priceID = dodoProduct.product_id;
            console.log(`Using Dodo Product: ${productName} (${priceID})`);

            let price = await prisma.price.findUnique({
              where: { priceID },
            });

            if (!price) {
              price = await prisma.price.create({
                data: {
                  priceID,
                  planId: createdPlan.id,
                  amount,
                  currency,
                  interval,
                },
              });
            }

            if (
              plan.id === PLANS.STARTER &&
              interval === INTERVALS.MONTH &&
              currency === CURRENCIES.USD
            ) {
              starterPriceId = priceID;
              starterPlanDbId = createdPlan.id;
              starterPriceDbId = price.id;
            }
          }
        }
      }
    }
  }
  console.timeEnd("💳 Creating plans...");
  return { starterPriceId, starterPlanDbId, starterPriceDbId };
}

async function seed() {
  console.log("🌱 Seeding...");
  console.time("🌱 Database has been seeded");

  if (!process.env.DODO_PAYMENTS_API_KEY) {
    console.warn(
      "DODO_PAYMENTS_API_KEY is not set. Seeding will continue, but payment features will not work."
    );
  }

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
  await prisma.role.create({
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
  await prisma.role.create({ data: { name: "user" } });
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
    data: { userId: adminUser.id, objectKey: "icon.png" },
  });
  console.timeEnd("🐨 Created admin user");

  const { starterPriceId, starterPlanDbId, starterPriceDbId } =
    await createPlansAndPrices();

  if (starterPriceId && starterPlanDbId && starterPriceDbId) {
    console.time("✨ Creating admin subscription...");

    const customer = await getOrCreateCustomer(
      adminUser.email,
      adminUser.name as string
    );
    console.log(`Using Dodo Customer: ${customer.customer_id}`);

    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: { customerId: customer.customer_id },
    });
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
