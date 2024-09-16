import { Plan, Price, User, type Subscription } from '@prisma/client'
import { type Stripe } from 'stripe'
import { stripe } from './config.server'
import { Interval } from '~/constants'
import { BillingPortalProducts } from '~/types'
import { getDomainUrl } from '~/lib/utils'

export async function configureStripeCustomerPortal(
    products: BillingPortalProducts[],
) {
    if (!products)
        throw new Error(
            'Missing required parameters to configure Stripe Customer Portal.',
        )

    return stripe.billingPortal.configurations.create({
        business_profile: {
            headline: 'Organization Name - Customer Portal',
        },
        features: {
            customer_update: {
                enabled: true,
                allowed_updates: ['address', 'shipping', 'tax_id', 'email'],
            },
            invoice_history: { enabled: true },
            payment_method_update: { enabled: true },
            // subscription_pause: { enabled: false },
            subscription_cancel: { enabled: true },
            subscription_update: {
                enabled: true,
                default_allowed_updates: ['price'],
                proration_behavior: 'always_invoice',
                products: products.filter(({ product }) => product !== 'free'),
            },
        },
    })
}

export async function createStripeCustomerPortalSession(
    customerId: User['customerId'],
    request: Request,
) {
    const HOST_URL = getDomainUrl(request)
    if (!customerId)
        throw new Error(
            'Missing required parameters to create Stripe Customer Portal.',
        )

    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${HOST_URL}/resources/stripe/create-customer-portal`,
    })
    if (!session?.url)
        throw new Error('Unable to create Stripe Customer Portal Session.')

    return session.url
}

export async function createStripeCheckoutSession(
    customerId: User['customerId'],
    priceId: Price['priceID'],
    request: Request,
    params?: Stripe.Checkout.SessionCreateParams,
) {
    const HOST_URL = getDomainUrl(request)
    if (!customerId || !priceId)
        throw new Error(
            'Missing required parameters to create Stripe Checkout Session.',
        )

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        payment_method_types: ['card'],
        success_url: `${HOST_URL}/checkout`,
        cancel_url: `${HOST_URL}/plans`,
        ...params,
    })
    if (!session?.url)
        throw new Error('Unable to create Stripe Checkout Session.')

    return session.url
}

export async function createStripeCustomer(
    customer?: Stripe.CustomerCreateParams,
) {
    if (!customer) throw new Error('No customer data provided.')
    return stripe.customers.create(customer)
}

export async function deleteStripeCustomer(customerId?: User['customerId']) {
    if (!customerId)
        throw new Error('Missing required parameters to delete Stripe Customer.')

    return stripe.customers.del(customerId)
}


export async function createStripePrice(
    id: Plan['planID'],
    price: Partial<Price>,
    params?: Stripe.PriceCreateParams,
) {
    if (!id || !price)
        throw new Error('Missing required parameters to create Stripe Price.')

    return stripe.prices.create({
        ...params,
        product: id,
        currency: price.currency ?? 'usd',
        unit_amount: price.amount ?? 0,
        tax_behavior: 'inclusive',
        recurring: {
            interval: (price.interval as Interval) ?? 'month',
        },
    })
}

export async function createStripeProduct(
    product: Partial<Plan>,
    params?: Stripe.ProductCreateParams,
) {
    if (!product || !product.id || !product.name)
        throw new Error('Missing required parameters to create Stripe Product.')

    return stripe.products.create({
        ...params,
        id: product.id,
        name: product.name,
        description: product.description || undefined,
    })
}


export async function retrieveStripeSubscription(
    id?: Subscription['id'],
    params?: Stripe.SubscriptionRetrieveParams,
) {
    if (!id)
        throw new Error(
            'Missing required parameters to retrieve Stripe Subscription.',
        )
    return stripe.subscriptions.retrieve(id, params)
}

export async function createStripeSubscription(
    customerId: User['customerId'],
    price: Price['priceID'],
    params?: Stripe.SubscriptionCreateParams,
) {
    if (!customerId || !price)
        throw new Error(
            'Missing required parameters to create Stripe Subscription.',
        )

    return stripe.subscriptions.create({
        ...params,
        customer: customerId,
        items: [{ price }],
    })
}
