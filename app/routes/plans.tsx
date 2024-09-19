import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { CheckoutButton } from '~/components/checkout-button'
import { getSubscriptionByUserId } from '~/models/subscription'
import {
	Interval,
	Currency,
	PRICING_PLANS,
} from '~/constants/index'
import { requireUserId } from '~/lib/auth/auth.server'
import { prisma } from '~/lib/db.server'
import { getDefaultCurrency } from '~/lib/locales'
import { CheckIcon } from 'lucide-react'
import { cn } from '~/lib/utils'
import { Label } from '~/components/ui/label'
import { Switch } from '@radix-ui/react-switch'


export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)

	// get user details from prisma
	const user = await prisma.user.findUniqueOrThrow({
		select: {
			id: true,
			customerId: true,
		},
		where: { id: userId },
	})

	const subscription = user.id ? await getSubscriptionByUserId(user.id) : null

	// Get client's currency.
	const defaultCurrency = getDefaultCurrency(request)

	return json({
		user,
		subscription,
		defaultCurrency,
	})
}

export default function Plans() {
	const { user, subscription, defaultCurrency } = useLoaderData<typeof loader>()
	const [planInterval, setPlanInterval] = useState<Interval | string>(
		subscription?.interval || Interval.MONTH,
	)

	return (
		<section>
			<div className='py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6'>
				<div className='mx-auto max-w-screen-md text-center mb-8 lg:mb-12'>
					<h2 className='mb-4 text-4xl tracking-tight font-extrabold'>
						Designed for business teams like yours
					</h2>
					<p className='mb-5 font-light text-gray-500 sm:text-xl'>
						Here at Flowbite we focus on markets where technology, innovation, and capital can unlock long-term value and drive economic growth
					</p>

					<div className="flex flex-col gap-4 items-center justify-center">
						<Label htmlFor="plan-toggle">{planInterval === Interval.MONTH ? 'Monthly' : 'Yearly'}</Label>
						<Switch id="plan-toggle"
							checked={planInterval === Interval.YEAR}
							onChange={() =>
								setPlanInterval(prev =>
									prev === Interval.MONTH ? Interval.YEAR : Interval.MONTH,
								)
							}
						/>
					</div>

				</div>
				<div className='space-y-8 flex justify-center flex-wrap gap-6 lg:space-y-0'>
					{Object.values(PRICING_PLANS).map(plan => {
						return (
							<div
								key={plan.planID}
								className={cn(
									'flex flex-col p-6 mx-auto max-w-lg text-center relative rounded-xl border border-border shadow xl:p-8',
									{
										'border-yellow-500 dark:border-yellow-300': plan.isPopular,
									}
								)}
							>

								{plan.isPopular && (
									<div className="absolute -right-3.5 top-5 -rotate-90 rounded-bl-full rounded-tl-full px-3 py-2 bg-yellow-500 dark:bg-yellow-300 font-medium uppercase text-xs">
										popular
									</div>
								)}
								<h3 className='mb-4 text-2xl font-semibold'>{plan.name}</h3>
								<p className='font-light text-gray-500 sm:text-lg'>{plan.description}</p>

								<h5 className="flex justify-center items-center text-5xl font-bold my-4">
									{defaultCurrency === Currency.EUR ? '€' : '$'}
									{planInterval === Interval.MONTH
										? plan.prices[Interval.MONTH][(defaultCurrency as Currency)] / 100
										: plan.prices[Interval.YEAR][(defaultCurrency as Currency)] / 100}
									<small className="relative left-1 top-2 text-lg text-gray-400">
										{planInterval === Interval.MONTH ? '/mo' : '/yr'}
									</small>
								</h5>
								<ul className='my-8 space-y-4 text-left'>
									{plan.features.map((feature, i) => (
										<li key={i} className='flex items-center space-x-3'>
											<CheckIcon className='text-green-300' />
											<span>{feature}</span>
										</li>
									))}
								</ul>
								{/* Checkout Component. */}
								{user && (
									<CheckoutButton
										currentPlanId={subscription?.planId ?? null}
										planId={plan.planID}
										planName={plan.name}
										planInterval={planInterval}
									/>
								)}
							</div>
						)
					})}
				</div>
			</div>
		</section>
	)
}

