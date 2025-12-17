import { invariantResponse } from "@epic-web/invariant";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { Link2Icon, X } from "lucide-react";
import { useState } from "react";
import {
  data,
  useFetcher,
  useLoaderData,
} from "react-router";
import { StatusButton } from "~/components/layout/status-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { userContext } from "~/context";
import { ProviderConnectionForm, providerIcons } from "~/lib/auth/connections";
import { prisma } from "~/lib/db.server";
import { createToastHeaders } from "~/lib/toast.server";
import {
  type ProviderName,
  ProviderNameSchema,
  providerNames,
} from "~/lib/validations";
import type { BreadcrumbHandle } from "~/lib/validations/index.js";
import type { Route } from "./+types/connections";

export const handle: BreadcrumbHandle & SEOHandle = {
  breadcrumb: (
    <div className="flex items-center gap-2">
      <Link2Icon className="h-4 w-4" />
      <span>Connections</span>
    </div>
  ),
  getSitemapEntries: () => null,
};

async function userCanDeleteConnections(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { password: true },
  });

  if (accounts.some((acc) => acc.password)) {
    return true;
  }

  return accounts.length > 1;
}

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userContext);
  invariantResponse(user, "User not found", { status: 404 });
  const userId = user?.id;
  const rawAccounts = await prisma.account.findMany({
    select: {
      id: true,
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
    providerName: ProviderName;
    id: string;
    displayName: string;
    link?: string | null;
    createdAtFormatted: string;
  }> = [];
  for (const account of rawAccounts) {
    const r = ProviderNameSchema.safeParse(account.providerId);
    if (!r.success) continue;
    const providerName = r.data;

    connections.push({
      displayName:
        account.user.username ?? account.user.name ?? "default username",
      providerName,
      id: account.id,
      createdAtFormatted: account.createdAt.toLocaleString(),
    });
  }

  return data({
    connections,
    canDeleteConnections: await userCanDeleteConnections(userId),
  });
}

export async function action({ request,context }: Route.ActionArgs) {
  const user = context.get(userContext);
  invariantResponse(user, "User not found", { status: 404 });
  const userId = user?.id;
  const formData = await request.formData();
  invariantResponse(
    formData.get("intent") === "delete-connection",
    "Invalid intent"
  );
  invariantResponse(
    await userCanDeleteConnections(userId),
    "You cannot delete your last connection unless you have a password."
  );
  const connectionId = formData.get("connectionId");
  invariantResponse(typeof connectionId === "string", "Invalid connectionId");
  await prisma.account.delete({
    where: {
      id: connectionId,
      userId,
    },
  });
  const toastHeaders = await createToastHeaders({
    title: "Deleted",
    description: "Your connection has been deleted.",
  });
  return data({ status: "success" } as const, { headers: toastHeaders });
}

export default function Connections() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-md">
      {data.connections.length ? (
        <div className="flex flex-col gap-2">
          <p>Here are your current connections:</p>
          <ul className="flex flex-col gap-4">
            {data.connections.map((c) => (
              <li key={c.id}>
                <Connection
                  canDelete={data.canDeleteConnections}
                  connection={c}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>You don&apos;t have any connections yet.</p>
      )}
      <div className="mt-5 flex flex-col gap-5 border-border border-t-2 border-b-2 py-3">
        {providerNames.map((providerName: ProviderName) => (
          <ProviderConnectionForm
            key={providerName}
            providerName={providerName}
            type="Connect"
          />
        ))}
      </div>
    </div>
  );
}

function Connection({
  connection,
  canDelete,
}: {
  connection: Route.ComponentProps['loaderData']['connections'][number];
  canDelete: boolean;
}) {
  const deleteFetcher = useFetcher<typeof action>();
  const [infoOpen, setInfoOpen] = useState(false);
  const icon = providerIcons[connection.providerName];
  return (
    <div className="flex justify-between gap-2">
      <span className={"inline-flex items-center gap-1.5"}>
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
          }{" "}
          ({connection.createdAtFormatted})
        </span>
      </span>
      {canDelete ? (
        <deleteFetcher.Form method="POST">
          <input name="connectionId" type="hidden" value={connection.id} />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <StatusButton
                  name="intent"
                  size="sm"
                  status={
                    deleteFetcher.state !== "idle"
                      ? "pending"
                      : (deleteFetcher.data?.status ?? "idle")
                  }
                  value="delete-connection"
                  variant="destructive"
                >
                  <X className="h-4 w-4" />
                </StatusButton>
              </TooltipTrigger>
              <TooltipContent>Disconnect this account</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </deleteFetcher.Form>
      ) : (
        <TooltipProvider>
          <Tooltip onOpenChange={setInfoOpen} open={infoOpen}>
            <TooltipTrigger onClick={() => setInfoOpen(true)}>
              <QuestionMarkCircledIcon className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>
              You cannot delete your last connection unless you have a password.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
