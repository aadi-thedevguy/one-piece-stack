import "dotenv/config";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { UniqueEnforcer } from "enforce-unique";
import { CURRENCIES, INTERVALS, PLANS, PRICING_PLANS } from "~/constants/index";
import { prisma } from "~/lib/db.server";
import { getOrCreateCustomer, getOrCreateProduct } from "~/lib/payment.server";

const uniqueUsernameEnforcer = new UniqueEnforcer();

function createUser() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  const username = uniqueUsernameEnforcer
    .enforce(
      () =>
        faker.string.alphanumeric({ length: 2 }) +
        "_" +
        faker.internet.username({
          firstName: firstName.toLowerCase(),
          lastName: lastName.toLowerCase(),
        })
    )
    .slice(0, 20)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");
  return {
    username,
    name: `${firstName} ${lastName}`,
    email: `${username}@example.com`,
  };
}

// Helper function to create a password hash
export function createPassword(password: string = faker.internet.password()) {
  return {
    hash: bcrypt.hashSync(password, 10),
  };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Seed script logic is inherently linear and acceptable
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

  console.time("🔑 Creating permissions...");
  const entities = ["user", "note"];
  const actions = ["create", "read", "update", "delete"];
  const accesses = ["own", "any"] as const;
  for (const entity of entities) {
    for (const action of actions) {
      for (const access of accesses) {
        await prisma.permission.create({ data: { entity, action, access } });
      }
    }
  }
  console.timeEnd("🔑 Created permissions...");

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
  await prisma.role.create({
    data: {
      name: "user",
      permissions: {
        connect: await prisma.permission.findMany({
          select: { id: true },
          where: { access: "own" },
        }),
      },
    },
  });
  console.timeEnd("👑 Created roles...");

  console.time("🐨 Creating admin user...");
  let adminUser = await prisma.user.create({
    select: { id: true, email: true, name: true },
    data: {
      email: "thedevguy99@gmail.com",
      username: "thedevguy",
      name: "Aditya",
      active: true,
      password: { create: createPassword("password") },
      roles: { connect: [{ name: "admin" }, { name: "user" }] },
    },
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
    console.timeEnd("✨ Created admin subscription...");
  }

  console.time("🌱 Creating users...");

  const plan = await prisma.plan.findFirst();
  const price = await prisma.price.findFirst({ where: { planId: plan?.id } });

  for (let i = 0; i < 10; i++) {
    const userData = createUser();
    const user = await prisma.user.create({
      select: { id: true },
      data: {
        ...userData,
        password: { create: createPassword(userData.username) },
        active: i % 2 === 0,
        roles: { connect: { name: "user" } },
      },
    });

    if (i % 2 === 0 && plan && price) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          priceId: price.id,
          interval: "month",
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.timeEnd("✅ Created 10 users.");

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
