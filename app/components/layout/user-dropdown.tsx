import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { LogOutIcon, User2Icon } from "lucide-react";
import { type FormEvent, useRef } from "react";
import { Form, Link, useSubmit } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
} from "~/components/ui/dropdown-menu";
import { placeholderAvatar } from "~/constants/keys";
import { getUserImgSrc, useUser } from "~/lib/utils";
import { Button } from "../ui/button";

export function UserDropdown() {
  const user = useUser();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button asChild variant="secondary">
          <Link
            className="flex items-center gap-2"
            // this is for progressive enhancement
            onClick={(e: FormEvent) => e.preventDefault()}
            to={`/users/${user.username}`}
          >
            <img
              alt={user.name ?? user.username}
              className="h-8 w-8 rounded-full object-cover"
              height={32}
              src={getUserImgSrc(user.image?.objectKey) || placeholderAvatar}
              width={32}
            />
            <span className="hidden font-bold text-body-sm sm:inline">
              {user.name ?? user.username}
            </span>
          </Link>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="start" sideOffset={8}>
          <DropdownMenuItem asChild>
            <Link
              className="flex items-center gap-2"
              prefetch="intent"
              to={`/users/${user.username}`}
            >
              <User2Icon className="h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            // this prevents the menu from closing before the form submission is completed
            onSelect={(event) => {
              event.preventDefault();
              submit(formRef.current);
            }}
          >
            <Form action="/logout" method="POST" ref={formRef}>
              <Button
                className="flex items-center gap-2"
                type="submit"
                variant="link"
              >
                <LogOutIcon className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </Form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
