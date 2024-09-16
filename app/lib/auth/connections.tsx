import { Form } from '@remix-run/react'
// import { TwitterLogoIcon } from "@radix-ui/react-icons"
import { useIsPending } from '../utils'
import { GoogleIcon } from '~/constants/icons'
import { StatusButton } from '~/components/layout/status-button'
import { ProviderName } from '../validations'
import { GitHubLogoIcon } from '@radix-ui/react-icons'

export const providerLabels: Record<ProviderName, string> = {
	// ['twitter']: 'Twitter',
	['github']: 'GitHub',
	['google']: 'Google',
} as const

export const providerIcons: Record<ProviderName, React.ReactNode> = {
	// ['twitter']: <TwitterLogoIcon className='w-6 h-6' />,
	['google']: <GoogleIcon className='w-6 h-6' />,
	['github']: <GitHubLogoIcon className='w-6 h-6' />,
} as const

export function ProviderConnectionForm({
	redirectTo,
	type,
	providerName,
}: {
	redirectTo?: string | null
	type: 'Connect' | 'Login' | 'Signup'
	providerName: ProviderName
}) {
	const label = providerLabels[providerName]
	const formAction = `/auth/${providerName}`
	const isPending = useIsPending({ formAction })
	return (
		<Form
			className="flex items-center justify-center gap-2"
			action={formAction}
			method="POST"
		>
			{redirectTo ? (
				<input type="hidden" name="redirectTo" value={redirectTo} />
			) : null}
			<StatusButton
				type="submit"
				className="w-full"
				status={isPending ? 'pending' : 'idle'}
			>
				<span className="inline-flex items-center gap-1.5">
					{providerIcons[providerName]}
					<span>
						{type} with {label}
					</span>
				</span>
			</StatusButton>
		</Form>
	)
}
