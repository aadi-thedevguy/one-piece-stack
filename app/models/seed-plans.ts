import { getAllPlans } from '~/models/plan'
import { createStripePrice, configureStripeCustomerPortal, createStripeProduct } from '~/services/payment/stripe.server'
import { PRICING_PLANS } from '~/constants/index'
import { prisma } from '~/lib/db.server'

export async function createStripePlans() {
    const plans = await getAllPlans()

    if (plans.length > 0) {
        console.log('🎉 Plans has already been seeded.')
        return true
    }

    const seedProducts = Object.values(PRICING_PLANS).map(
        async ({ planID, name, description, limits, prices }) => {
            // Format prices to match Stripe's API.
            const pricesByInterval = Object.entries(prices).flatMap(
                ([interval, price]) => {
                    return Object.entries(price).map(([currency, amount]) => ({
                        interval,
                        currency,
                        amount,
                    }))
                },
            )

            try {
                // Create Stripe product.
                await createStripeProduct({
                    planID,
                    name,
                    description: description || undefined,
                })
            } catch (e: unknown) {
                if (e instanceof Error) {
                    console.log(`Error occured ${e.message}`)
                }
                console.log(`Error occured ${e}`)
            }

            // Create Stripe price for the current product.
            try {
                const stripePrices = await Promise.all(
                    pricesByInterval.map(price => {
                        return createStripePrice(planID, price)
                    }),
                )

                // Store product/plan into database.
                await prisma.plan.create({
                    data: {
                        planID,
                        name,
                        description,
                        limits: {
                            create: {
                                maxItems: limits.maxItems,
                            },
                        },
                        prices: {
                            create: stripePrices.map(price => ({
                                // id: price.id,
                                priceID: price.id,
                                amount: price.unit_amount ?? 0,
                                currency: price.currency,
                                interval: price.recurring?.interval ?? 'month',
                            })),
                        },
                    },
                })

                // Return product ID and prices.
                // Used to configure the Customer Portal.
                return {
                    product: planID,
                    prices: stripePrices.map(price => price.id),
                }
            } catch (error) {
                throw new Error('Failed to create Stripe prices')
            }
        },
    )

    try {
        // Create Stripe products and stores them into database.
        const seededProducts = await Promise.all(seedProducts)
        console.log(`📦 Stripe Products has been successfully created.`)

        // Configure Customer Portal.
        await configureStripeCustomerPortal(seededProducts)
        console.log(`👒 Stripe Customer Portal has been successfully configured.`)
        console.log(
            '🎉 Visit: https://dashboard.stripe.com/test/products to see your products.',
        )
    } catch (error) {
        throw new Error('Failed to create Stripe product/customer-portal')
    }
}
