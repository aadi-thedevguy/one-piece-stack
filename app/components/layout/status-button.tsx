import { UpdateIcon } from "@radix-ui/react-icons";
import { CircleCheck, X } from "lucide-react";
import type * as React from "react";
import { useSpinDelay } from "spin-delay";
import { cn } from "~/lib/utils";
import { Button, type ButtonVariant } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export const StatusButton = ({
  message,
  status,
  className,
  children,
  spinDelay,
  ...props
}: React.ComponentProps<"button"> &
  ButtonVariant & {
    status: "pending" | "success" | "error" | "idle";
    message?: string | null;
    spinDelay?: Parameters<typeof useSpinDelay>[1];
  }) => {
  const delayedPending = useSpinDelay(status === "pending", {
    delay: 400,
    minDuration: 300,
    ...spinDelay,
  });
  const companion = {
    pending: delayedPending ? (
      <output className="inline-flex size-6 items-center justify-center">
        <UpdateIcon className="animate-spin" name="update" />
      </output>
    ) : null,
    success: (
      <output className="inline-flex size-6 items-center justify-center">
        <CircleCheck name="check" />
      </output>
    ),
    error: (
      <output className="inline-flex size-6 items-center justify-center rounded-full bg-destructive">
        <X className="text-destructive-foreground" />
      </output>
    ),
    idle: null,
  }[status];

  return (
    <Button className={cn("flex justify-center gap-4", className)} {...props}>
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
  );
};
StatusButton.displayName = "Button";
