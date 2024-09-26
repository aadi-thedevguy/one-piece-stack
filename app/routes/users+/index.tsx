import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/layout/error-boundary'
import { ErrorList } from '~/components/layout/forms'
import { SearchBar } from '~/components/layout/search-bar'
import { prisma } from '~/lib/db.server'
import { cn, useDelayedIsPending } from '~/lib/utils'

export async function loader({ request }: LoaderFunctionArgs) {
	const searchTerm = new URL(request.url).searchParams.get('search')
	if (!searchTerm || searchTerm === '') {
		return redirect('/users')
	}

	const result = await prisma.user.findMany({
		where: {
			OR: [
				{ username: { contains: searchTerm, mode: 'insensitive' } },
				{ name: { contains: searchTerm, mode: 'insensitive' } },
			],
		},
		select: {
			id: true,
			username: true,
			name: true,
			image: true
		},
	});
	if (!result.length) {
		return json({ status: 'error', error: "No users found" } as const, {
			status: 400,
		})
	}
	return json({ status: 'idle', users: result } as const)
}

export default function UsersRoute() {
	const data = useLoaderData<typeof loader>()
	const isPending = useDelayedIsPending({
		formMethod: 'GET',
		formAction: '/users',
	})

	if (data.status === 'error') {
		console.error(data.error)
	}

	return (
		<div className="container mb-48 mt-36 flex flex-col items-center justify-center gap-6">
			<h1 className="text-h1">Epic Notes Users</h1>
			<div className="w-full max-w-[700px]">
				<SearchBar status={data.status} autoSubmit />
			</div>
			<main>
				{data.status === 'idle' ? (
					data.users.length ? (
						<ul
							className={cn(
								'flex w-full flex-wrap items-center justify-center gap-4 delay-200',
								{ 'opacity-50': isPending },
							)}
						>
							{data.users.map((user) => (
								<li key={user.id}>
									<Link
										to={user.username}
										className="flex h-36 w-44 flex-col items-center justify-center rounded-lg bg-muted px-5 py-3"
									>
										<img
											alt={user.name ?? user.username}
											src={user.image?.url}
											className="h-16 w-16 rounded-full"
										/>
										{user.name ? (
											<span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-body-md">
												{user.name}
											</span>
										) : null}
										<span className="w-full overflow-hidden text-ellipsis text-center text-body-sm text-muted-foreground">
											{user.username}
										</span>
									</Link>
								</li>
							))}
						</ul>
					) : (
						<p>No users found</p>
					)
				) : data.status === 'error' ? (
					<ErrorList errors={['There was an error parsing the results']} />
				) : null}
			</main>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
