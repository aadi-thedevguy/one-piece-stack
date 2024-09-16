import { User } from "@prisma/client";
import { prisma } from "~/lib/db.server";


export async function deleteUserById(id: User['id']) {
    return prisma.user.delete({
        where: { id },
    })
}

export async function updateUserById(id: User['id'], user: Partial<User>) {
    return prisma.user.update({
        where: { id },
        data: { ...user },
    })
}

export async function getUserById(id: User['id']) {
    return prisma.user.findUnique({
        where: { id },
    })
}

export async function getUserByEmail(email: User['email']) {
    return prisma.user.findUnique({
        where: { email },
    })
}

export async function getUserByCustomerId(customerId: User['customerId']) {
    if (!customerId)
        throw new Error('Missing required parameters to retrieve User.')

    return prisma.user.findUnique({
        where: { customerId },
    })
}
