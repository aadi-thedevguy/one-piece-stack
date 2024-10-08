import { invariantResponse } from '@epic-web/invariant'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useMatches } from '@remix-run/react'
import { Edit3 } from 'lucide-react'
import { z } from 'zod'
import { requireUserId } from '~/lib/auth/auth.server'
import { prisma } from '~/lib/db.server'
import { cn } from '~/lib/utils'
import { BreadcrumbHandle } from '~/lib/validations'
import { useUser } from '~/services/user'

export const handle: BreadcrumbHandle & SEOHandle = {
	breadcrumb: <div className="flex items-center gap-2">
		<Edit3 className='h-4 w-4' />
		<span>Edit Profile</span>
	</div>,
	getSitemapEntries: () => null,
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { username: true },
	})
	invariantResponse(user, 'User not found', { status: 404 })
	return json({})
}

const BreadcrumbHandleMatch = z.object({
	handle: BreadcrumbHandle,
})

export default function EditUserProfile() {
	const user = useUser()
	const matches = useMatches()
	const breadcrumbs = matches
		.map((m) => {
			const result = BreadcrumbHandleMatch.safeParse(m)
			if (!result.success || !result.data.handle.breadcrumb) return null
			return (
				<Link key={m.id} to={m.pathname} className="flex items-center">
					{result.data.handle.breadcrumb}
				</Link>
			)
		})
		.filter(Boolean)

	return (
		<div className="m-auto mb-24 mt-16 max-w-3xl">
			<div className="container">
				<ul className="flex gap-3">
					<li>
						<Link
							className="text-muted-foreground"
							to={`/users/${user.username}`}
						>
							Profile
						</Link>
					</li>
					{breadcrumbs.map((breadcrumb, i, arr) => (
						<li
							key={i}
							className={cn('flex items-center gap-3', {
								'text-muted-foreground': i < arr.length - 1,
							})}
						>
							▶️ {breadcrumb}
						</li>
					))}
				</ul>
			</div>
			<main className="mx-auto bg-muted px-6 py-8 md:container md:rounded-3xl">
				<Outlet />
			</main>
		</div>
	)
}
