import { Form } from "react-router";
import { StatusButton } from "~/components/layout/status-button";
import { GoogleIcon } from "~/constants/icons";
import { useIsPending } from "../utils";
import type { ProviderName } from "../validations";
// import { TwitterLogoIcon } from "@radix-ui/react-icons"

export const providerLabels: Record<ProviderName, string> = {
  // twitter: 'Twitter',
  google: "Google",
} as const;

export const providerIcons: Record<ProviderName, React.ReactNode> = {
  google: <GoogleIcon className="h-6 w-6" />,
  // twitter: <TwitterLogoIcon className='w-6 h-6' />,
} as const;

export function ProviderConnectionForm({
  redirectTo,
  type,
  providerName,
}: {
  redirectTo?: string | null;
  type: "Connect" | "Login" | "Signup";
  providerName: ProviderName;
}) {
  const label = providerLabels[providerName];
  const formAction = `/auth/${providerName}`;
  const isPending = useIsPending({ formAction });
  return (
    <Form
      action={formAction}
      className="flex items-center justify-center gap-2"
      method="POST"
    >
      {redirectTo ? (
        <input name="redirectTo" type="hidden" value={redirectTo} />
      ) : null}
      <StatusButton
        className="w-full"
        status={isPending ? "pending" : "idle"}
        type="submit"
      >
        <span className="inline-flex items-center gap-1.5">
          {providerIcons[providerName]}
          <span>
            {type} with {label}
          </span>
        </span>
      </StatusButton>
    </Form>
  );
}
