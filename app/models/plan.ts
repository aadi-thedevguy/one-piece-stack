import { type Prisma, type Plan } from '@prisma/client'
import { prisma } from '~/lib/db.server'

export async function getPlanById(
	planID: Plan['planID'],
	include?: Prisma.PlanInclude,
) {
	return prisma.plan.findUnique({
		where: { planID },
		include: {
			...include,
			prices: include?.prices || false,
		},
	})
}

export async function getAllPlans(include?: Prisma.PlanInclude) {
	return prisma.plan.findMany({
		include: {
			...include,
			prices: include?.prices || false,
		},
	})
}

export async function createPlan(plan: Omit<Plan, 'createdAt' | 'updatedAt'>) {
	return prisma.plan.create({
		data: { ...plan },
	})
}

export async function deletePlanById(id: Plan['id']) {
	return prisma.plan.delete({
		where: { id },
	})
}

export async function updatePlanById(id: Plan['id'], plan: Partial<Plan>) {
	return prisma.plan.update({
		where: { id },
		data: { ...plan },
	})
}
