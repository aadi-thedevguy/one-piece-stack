import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	redirect,
	json,
} from '@remix-run/node'
import { createStripeCustomerPortalSession } from '~/services/payment/stripe.server'
import { requireUserId } from '~/lib/auth/auth.server'
import { prisma } from '~/lib/db.server'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)
	return redirect('/account')
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)

	// get user details from prisma
	const user = await prisma.user.findUniqueOrThrow({
		select: {
			customerId: true,
		},
		where: { id: userId },
	})

	// Redirect to Customer Portal.
	if (user.customerId) {
		const customerPortalUrl = await createStripeCustomerPortalSession(
			user.customerId,
			request,
		)
		return redirect(customerPortalUrl)
	}

	return json({}, { status: 400 })
}