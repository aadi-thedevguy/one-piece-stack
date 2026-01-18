import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useId } from "react";
import { Form, useSearchParams, useSubmit } from "react-router";
import { useDebounce, useIsPending } from "~/lib/utils";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { StatusButton } from "./status-button";

export function SearchBar({
  status,
  autoFocus = false,
  autoSubmit = false,
}: {
  status: "idle" | "pending" | "success" | "error";
  autoFocus?: boolean;
  autoSubmit?: boolean;
}) {
  const id = useId();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const isSubmitting = useIsPending({
    formMethod: "GET",
    formAction: "/users",
  });

  const handleFormChange = useDebounce((form: HTMLFormElement) => {
    submit(form);
  }, 400);

  return (
    <Form
      action="/users"
      className="flex flex-wrap items-center justify-center gap-2"
      method="GET"
      onChange={(e) => autoSubmit && handleFormChange(e.currentTarget)}
    >
      <div className="flex-1">
        <Label className="sr-only" htmlFor={id}>
          Search
        </Label>
        <Input
          autoFocus={autoFocus}
          className="w-full"
          defaultValue={searchParams.get("search") ?? ""}
          id={id}
          name="search"
          placeholder="Search"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          type="search"
        />
      </div>
      <div>
        <StatusButton
          className="flex w-full items-center justify-center"
          status={isSubmitting ? "pending" : status}
          type="submit"
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </StatusButton>
      </div>
    </Form>
  );
}
