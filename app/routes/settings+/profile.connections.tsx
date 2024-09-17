import { invariantResponse } from '@epic-web/invariant'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import {
    json,
    type LoaderFunctionArgs,
    type ActionFunctionArgs,
    type SerializeFrom,
    type HeadersFunction,
} from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { StatusButton } from '~/components/layout/status-button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '~/components/ui/tooltip'
import { requireUserId } from '~/lib/auth/auth.server'
// import { resolveConnectionData } from ''
import { ProviderNameSchema, providerNames, ProviderName } from '~/lib/validations'
import { prisma } from '~/lib/db.server'
import { createToastHeaders } from '~/lib/toast.server'
import { type BreadcrumbHandle } from '~/lib/validations/index.js'
import { QuestionMarkCircledIcon } from '@radix-ui/react-icons'
import { Link2Icon, X } from 'lucide-react'
import { ProviderConnectionForm, providerIcons } from '~/lib/auth/connections'

export const handle: BreadcrumbHandle & SEOHandle = {
    breadcrumb: <div className='flex items-center gap-2'>
        <Link2Icon className='h-4 w-4' />
        <span>Connections</span>
    </div>,
    getSitemapEntries: () => null,
}

async function userCanDeleteConnections(userId: string) {
    const user = await prisma.user.findUnique({
        select: {
            password: { select: { userId: true } },
            _count: { select: { connections: true } },
        },
        where: { id: userId },
    })
    // user can delete their connections if they have a password
    if (user?.password) return true
    // users have to have more than one remaining connection to delete one
    return Boolean(user?._count.connections && user?._count.connections > 1)
}

export async function loader({ request }: LoaderFunctionArgs) {
    const userId = await requireUserId(request)
    const rawConnections = await prisma.connection.findMany({
        select: {
            id: true,
            providerName: true,
            providerId: true,
            createdAt: true,
            user: {
                select: {
                    username: true,
                    name: true,
                },
            },
        },
        where: { userId },
    });


    const connections: Array<{
        providerName: ProviderName
        id: string
        displayName: string
        link?: string | null
        createdAtFormatted: string
    }> = []
    for (const connection of rawConnections) {
        const r = ProviderNameSchema.safeParse(connection.providerName)
        if (!r.success) continue
        const providerName = r.data

        connections.push({
            // link: connection.,
            displayName: connection.user.username,
            providerName,
            id: connection.id,
            createdAtFormatted: connection.createdAt.toLocaleString(),
        })
    }

    return json(
        {
            connections,
            canDeleteConnections: await userCanDeleteConnections(userId),
        },
    )
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
    const headers = {
        'Server-Timing': loaderHeaders.get('Server-Timing') ?? '',
    }
    return headers
}

export async function action({ request }: ActionFunctionArgs) {
    const userId = await requireUserId(request)
    const formData = await request.formData()
    invariantResponse(
        formData.get('intent') === 'delete-connection',
        'Invalid intent',
    )
    invariantResponse(
        await userCanDeleteConnections(userId),
        'You cannot delete your last connection unless you have a password.',
    )
    const connectionId = formData.get('connectionId')
    invariantResponse(typeof connectionId === 'string', 'Invalid connectionId')
    await prisma.connection.delete({
        where: {
            id: connectionId,
            userId: userId,
        },
    })
    const toastHeaders = await createToastHeaders({
        title: 'Deleted',
        description: 'Your connection has been deleted.',
    })
    return json({ status: 'success' } as const, { headers: toastHeaders })
}

export default function Connections() {
    const data = useLoaderData<typeof loader>()

    return (
        <div className="mx-auto max-w-md">
            {data.connections.length ? (
                <div className="flex flex-col gap-2">
                    <p>Here are your current connections:</p>
                    <ul className="flex flex-col gap-4">
                        {data.connections.map((c) => (
                            <li key={c.id}>
                                <Connection
                                    connection={c}
                                    canDelete={data.canDeleteConnections}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p>You don&apos;t have any connections yet.</p>
            )}
            <div className="mt-5 flex flex-col gap-5 border-b-2 border-t-2 border-border py-3">
                {providerNames.map((providerName: ProviderName) => (
                    <ProviderConnectionForm
                        key={providerName}
                        type="Connect"
                        providerName={providerName}
                    />
                ))}
            </div>
        </div>
    )
}

function Connection({
    connection,
    canDelete,
}: {
    connection: SerializeFrom<typeof loader>['connections'][number]
    canDelete: boolean
}) {
    const deleteFetcher = useFetcher<typeof action>()
    const [infoOpen, setInfoOpen] = useState(false)
    const icon = providerIcons[connection.providerName]
    return (
        <div className="flex justify-between gap-2">
            <span className={`inline-flex items-center gap-1.5`}>
                {icon}
                <span>
                    {
                        // connection.link ? (
                        //     <a href={connection.link} className="underline">
                        //         {connection.displayName}
                        //     </a>
                        // ) : 
                        // (
                        connection.displayName
                    }{' '}
                    ({connection.createdAtFormatted})
                </span>
            </span>
            {canDelete ? (
                <deleteFetcher.Form method="POST">
                    <input name="connectionId" value={connection.id} type="hidden" />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <StatusButton
                                    name="intent"
                                    value="delete-connection"
                                    variant="destructive"
                                    size="sm"
                                    status={
                                        deleteFetcher.state !== 'idle'
                                            ? 'pending'
                                            : (deleteFetcher.data?.status ?? 'idle')
                                    }
                                >
                                    <X className='h-4 w-4' />
                                </StatusButton>
                            </TooltipTrigger>
                            <TooltipContent>Disconnect this account</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </deleteFetcher.Form>
            ) : (
                <TooltipProvider>
                    <Tooltip open={infoOpen} onOpenChange={setInfoOpen}>
                        <TooltipTrigger onClick={() => setInfoOpen(true)}>
                            <QuestionMarkCircledIcon className='h-4 w-4' />
                        </TooltipTrigger>
                        <TooltipContent>
                            You cannot delete your last connection unless you have a password.
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    )
}
