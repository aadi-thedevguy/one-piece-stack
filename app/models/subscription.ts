import { User, type Subscription } from '@prisma/client'
import { prisma } from '~/lib/db.server'

export async function createSubscription(
    subscription: Omit<Subscription, 'createdAt' | 'updatedAt' | 'id'>,
) {
    return prisma.subscription.create({
        data: { ...subscription },
    })
}

export async function deleteSubscriptionById(id: Subscription['id']) {
    return prisma.subscription.delete({
        where: { id },
    })
}

export async function getSubscriptionById(id: Subscription['subscriptionID']) {
    return prisma.subscription.findUnique({
        where: { subscriptionID: id },
    })
}

export async function getSubscriptionByUserId(userId: User['id']) {
    return prisma.subscription.findUnique({
        where: { userId },
    })
}

export async function updateSubscriptionById(
    subscriptionID: Subscription['subscriptionID'],
    subscription: Partial<Subscription>,
) {
    return prisma.subscription.update({
        where: { subscriptionID },
        data: { ...subscription },
    })
}

export async function updateSubscriptionByUserId(
    userId: Subscription['userId'],
    subscription: Partial<Subscription>,
) {
    return prisma.subscription.update({
        where: { userId },
        data: { ...subscription },
    })
}
