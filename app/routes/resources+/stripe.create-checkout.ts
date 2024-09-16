import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	redirect,
} from '@remix-run/node'
import { getPlanById } from '~/models/plan'
import { createStripeCheckoutSession } from '~/services/payment/stripe.server'
import { requireUserId } from '~/lib/auth/auth.server'
import { prisma } from '~/lib/db.server'
import { getDefaultCurrency } from '~/lib/locales'
export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)
	return redirect('/account')
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request, { redirectTo: '/login' })

	// get user details from prisma
	const user = await prisma.user.findUniqueOrThrow({
		select: {
			customerId: true,
		},
		where: { id: userId },
	})

	if (!user.customerId) throw new Error('Unable to get Customer ID.')

	// Get form values.
	const formData = Object.fromEntries(await request.formData())
	const formDataParsed = JSON.parse(formData.plan as string) as any
	const planId = String(formDataParsed.planId)
	const planInterval = String(formDataParsed.planInterval)

	if (!planId || !planInterval)
		throw new Error(
			'Missing required parameters to create Stripe Checkout Session.',
		)

	// Get client's currency.
	const defaultCurrency = getDefaultCurrency(request)

	// Get price ID for the requested plan.
	const plan = await getPlanById(planId, { prices: true })
	const planPrice = plan?.prices.find(
		price =>
			price.interval === planInterval && price.currency === defaultCurrency,
	)
	if (!planPrice) throw new Error('Unable to find a Plan price.')

	// Redirect to Checkout.
	const checkoutUrl = await createStripeCheckoutSession(
		user.customerId,
		planPrice.id,
		request,
	)
	return redirect(checkoutUrl)
}