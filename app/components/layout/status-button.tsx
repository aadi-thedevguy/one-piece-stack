import * as React from 'react'
import { useSpinDelay } from 'spin-delay'
import { cn } from '~/lib/utils'
import { Button, type ButtonProps } from '../ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip'
import { CircleCheck, X } from 'lucide-react'
import { UpdateIcon } from '@radix-ui/react-icons'

export const StatusButton = React.forwardRef<
    HTMLButtonElement,
    ButtonProps & {
        status: 'pending' | 'success' | 'error' | 'idle'
        message?: string | null
        spinDelay?: Parameters<typeof useSpinDelay>[1]
    }
>(({ message, status, className, children, spinDelay, ...props }, ref) => {
    const delayedPending = useSpinDelay(status === 'pending', {
        delay: 400,
        minDuration: 300,
        ...spinDelay,
    })
    const companion = {
        pending: delayedPending ? (
            <div
                role="status"
                className="inline-flex h-6 w-6 items-center justify-center"
            >
                <UpdateIcon className="animate-spin" />
            </div>
        ) : null,
        success: (
            <div
                role="status"
                className="inline-flex h-6 w-6 items-center justify-center"
            >
                {/* <Icon name="check" title="success" /> */}
                <CircleCheck className="text-green-500" />
            </div>
        ),
        error: (
            <div
                role="status"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive"
            >
                {/* <Icon
					name="cross-1"
					className="text-destructive-foreground"
					title="error"
				/> */}
                <X className="text-red-500 fill-red-500" />
            </div>
        ),
        idle: null,
    }[status]

    return (
        <Button
            ref={ref}
            className={cn('flex justify-center items-center gap-4', className)}
            {...props}
        >
            <div>{children}</div>
            {message ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>{companion}</TooltipTrigger>
                        <TooltipContent>{message}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                companion
            )}
        </Button>
    )
})
StatusButton.displayName = 'Button'
