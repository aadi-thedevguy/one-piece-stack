// import { createStripePlans } from "../app/models/seed-plans";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { prisma } from "~/lib/db.server";

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
  ]);
  console.timeEnd("🧹 Cleaned up the database...");

  console.time("🔑 Creating permissions...");
  // const entities = ['user', 'note']
  // const actions = ['create', 'read', 'update', 'delete']
  // const accesses = ['own', 'any'] as const

  // const permissionsToCreate = []
  // for (const entity of entities) {
  //     for (const action of actions) {
  //         for (const access of accesses) {
  //             permissionsToCreate.push({ entity, action, access })
  //         }
  //     }
  // }
  // await prisma.permission.createMany({ data: permissionsToCreate })
  // console.timeEnd('🔑 Created permissions...')

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
  const adminUser = await prisma.user.create({
    select: { id: true },
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

  //   await createStripePlans();

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

// we're ok to import from the test directory in this file
/*
eslint
    no-restricted-imports: "off",
*/
