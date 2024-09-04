import { Form, useSearchParams, useSubmit } from '@remix-run/react'
import { useId } from 'react'
import { useDebounce, useIsPending } from '~/lib/utils'
import { StatusButton } from './status-button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'

export function SearchBar({
    status,
    autoFocus = false,
    autoSubmit = false,
}: {
    status: 'idle' | 'pending' | 'success' | 'error'
    autoFocus?: boolean
    autoSubmit?: boolean
}) {
    const id = useId()
    const [searchParams] = useSearchParams()
    const submit = useSubmit()
    const isSubmitting = useIsPending({
        formMethod: 'GET',
        formAction: '/users',
    })

    const handleFormChange = useDebounce((form: HTMLFormElement) => {
        submit(form)
    }, 400)

    return (
        <Form
            method="GET"
            action="/users"
            className="flex flex-wrap items-center justify-center gap-2"
            onChange={(e) => autoSubmit && handleFormChange(e.currentTarget)}
        >
            <div className="flex-1">
                <Label htmlFor={id} className="sr-only">
                    Search
                </Label>
                <Input
                    type="search"
                    name="search"
                    id={id}
                    defaultValue={searchParams.get('search') ?? ''}
                    placeholder="Search"
                    className="w-full"
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus={autoFocus}
                />
            </div>
            <div>
                <StatusButton
                    type="submit"
                    status={isSubmitting ? 'pending' : status}
                    className="flex w-full items-center justify-center"
                >
                    <MagnifyingGlassIcon className="w-5 h-5" />
                    <span className="sr-only">Search</span>
                </StatusButton>
            </div>
        </Form>
    )
}
