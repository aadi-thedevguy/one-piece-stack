import { useUser } from '~/services/user'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal } from '~/components/ui/dropdown-menu'
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { LogOutIcon, User2Icon } from 'lucide-react'
import { Form, Link, useSubmit } from '@remix-run/react'
import { FormEvent, useRef } from 'react'
import { Button } from '../ui/button'
import { getUserImgSrc } from '~/lib/utils'

export function UserDropdown() {
    const user = useUser()
    const submit = useSubmit()
    const formRef = useRef<HTMLFormElement>(null)
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button asChild variant="secondary">
                    <Link
                        to={`/users/${user.username}`}
                        // this is for progressive enhancement
                        onClick={(e: FormEvent) => e.preventDefault()}
                        className="flex items-center gap-2"
                    >
                        <img
                            className="h-8 w-8 rounded-full object-cover"
                            alt={user.name ?? user.username}
                            src={getUserImgSrc(user.image?.id)}
                        />
                        <span className="text-body-sm font-bold">
                            {user.name ?? user.username}
                        </span>
                    </Link>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
                <DropdownMenuContent sideOffset={8} align="start">
                    <DropdownMenuItem asChild>
                        <Link prefetch="intent" to={`/users/${user.username}`} className='flex items-center gap-2'>
                            <User2Icon className='h-4 w-4' />
                            <span>
                                Profile
                            </span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        asChild
                        // this prevents the menu from closing before the form submission is completed
                        onSelect={(event) => {
                            event.preventDefault()
                            submit(formRef.current)
                        }}
                    >
                        <Form action="/logout" method="POST" ref={formRef}>
                            <Button type="submit" variant="link" className='flex items-center gap-2'>
                                <LogOutIcon className='h-4 w-4' />
                                <span>
                                    Logout
                                </span>
                            </Button>
                        </Form>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
    )
}