import { prisma } from '~/lib/db.server'
import { createStripePlans } from '../app/models/seed-plans'


async function seed() {
    console.log('🌱 Seeding...')
    console.time(`🌱 Database has been seeded`)

    console.time('🧹 Cleaning up the database...')
    await Promise.all([
        prisma.user.deleteMany(),
        prisma.note.deleteMany(),
        prisma.connection.deleteMany(),
        prisma.verification.deleteMany(),
        prisma.session.deleteMany(),
        prisma.password.deleteMany(),
        prisma.userImage.deleteMany(),

    ])
    console.timeEnd('🧹 Cleaned up the database...')

    console.time('🔑 Creating permissions...')
    const entities = ['user', 'note']
    const actions = ['create', 'read', 'update', 'delete']
    const accesses = ['own', 'any'] as const

    const permissionsToCreate = []
    for (const entity of entities) {
        for (const action of actions) {
            for (const access of accesses) {
                permissionsToCreate.push({ entity, action, access })
            }
        }
    }
    await prisma.permission.createMany({ data: permissionsToCreate })
    console.timeEnd('🔑 Created permissions...')

    console.time('👑 Creating roles...')
    await prisma.role.create({
        data: {
            name: 'admin',
            permissions: {
                connect: await prisma.permission.findMany({
                    select: { id: true },
                    where: { access: 'any' },
                }),
            },
        },
    })
    await prisma.role.create({
        data: {
            name: 'user',
            permissions: {
                connect: await prisma.permission.findMany({
                    select: { id: true },
                    where: { access: 'own' },
                }),
            },
        },
    })
    console.timeEnd('👑 Created roles...')

    await createStripePlans()


    console.timeEnd(`🌱 Database has been seeded`)
}

seed()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

// we're ok to import from the test directory in this file
/*
eslint
    no-restricted-imports: "off",
*/
