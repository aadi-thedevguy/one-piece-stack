// This is called a "splat route" and as it's in the root `/app/routes/`
// directory, it's a catchall. If no other routes match, this one will and we
// can know that the user is hitting a URL that doesn't exist. By throwing a
// 404 from the loader, we can force the error boundary to render which will
// ensure the user gets the right status code and we can display a nicer error
// message for them than the Remix and/or browser default.

import { Link, useLocation } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/layout/error-boundary'
import { ArrowRightIcon } from 'lucide-react'
import { buttonVariants } from '~/components/ui/button'

export async function loader() {
	throw new Response('Not found', { status: 404 })
}

export default function NotFound() {
	// due to the loader, this component will never be rendered, but we'll return
	// the error boundary just in case.
	return <ErrorBoundary />
}

export function ErrorBoundary() {
	const location = useLocation()
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => (
					<section className="overflow-hidden pb-25 pt-45 lg:pb-32.5 lg:pt-50 xl:pb-37.5 xl:pt-55">
						<div className=" mx-auto max-w-[518px] text-center">
							<img
								src="/images/shape/404.svg"
								alt="404"
								className="mx-auto mb-8"
								width={400}
								height={400}
							/>

							<h2 className="mb-5 text-2xl font-semibold md:text-4xl">
								This Page {location.pathname} Does Not Exist
							</h2>
							<p className="mb-8">
								The page you were looking for appears to have been moved, deleted or
								does not exist.
							</p>

							<Link to="/" className={buttonVariants({ variant: "secondary" })}>
								Return to Home
								<ArrowRightIcon className="w-5 h-5 ml-1" />
							</Link>

						</div>
					</section>
				),
			}}
		/>
	)
}
