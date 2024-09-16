import { type LoaderFunctionArgs, redirect } from '@remix-run/node'
import { updateUserById } from '~/models/user'
import { createStripeCustomer } from '~/services/payment/stripe.server'
import { requireUserId } from '~/lib/auth/auth.server'
import { prisma } from '~/lib/db.server'

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)

	// get user details from prisma
	const user = await prisma.user.findUniqueOrThrow({
		select: {
			id: true,
			customerId: true,
			email: true,
			name: true,
		},
		where: { id: userId },
	})

	if (user.customerId) return redirect('/account')

	// Create Stripe Customer.
	const email = user.email ? user.email : undefined
	const name = user.name ? user.name : undefined

	const customer = await createStripeCustomer({ email, name })
	if (!customer) throw new Error('Unable to create Stripe Customer.')

	// Update user.
	await updateUserById(user.id, { customerId: customer.id })

	return redirect('/account')
}