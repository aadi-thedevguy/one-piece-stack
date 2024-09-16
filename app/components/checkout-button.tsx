import { type Plan } from '@prisma/client'
import { useFetcher } from '@remix-run/react'
import { type Interval, PlanId } from '~/constants/index'
import { Button } from './ui/button'

type CheckoutButtonProps = {
    currentPlanId: Plan['id'] | null
    planId: Plan['id']
    planName: Plan['name']
    planInterval: Interval | string
}

export function CheckoutButton({
    currentPlanId,
    planId,
    planName,
    planInterval,
}: CheckoutButtonProps) {
    const fetcher = useFetcher()
    const isLoading = fetcher.state !== 'idle'

    if (planId === currentPlanId) {
        return (
            <Button
                disabled
            >
                <span>Current</span>
            </Button>
        )
    }

    return (
        <fetcher.Form action="/resources/stripe/create-checkout" method="post">
            <Button
                size="lg"
                value={JSON.stringify({ planId, planInterval })}
                disabled={currentPlanId !== PlanId.STARTER}
            // variant={currentPlanId !== PlanId.STARTER ? 'default' : 'ghost'}
            >
                <span>{isLoading ? 'Redirecting ...' : `Get ${planName}`}</span>
            </Button>
        </fetcher.Form>
    )
}