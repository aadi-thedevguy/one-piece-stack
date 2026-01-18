import { invariantResponse } from "@epic-web/invariant";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { Link2, X } from "lucide-react";
import { useState } from "react";
import { data, useFetcher } from "react-router";
import { StatusButton } from "~/components/layout/status-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { userIdContext } from "~/context";
import { ProviderConnectionForm, providerIcons } from "~/lib/auth/connections";
import { prisma } from "~/lib/db.server";
import { pipeHeaders } from "~/lib/headers.server";
import { makeTimings } from "~/lib/timing.server";
import { createToastHeaders } from "~/lib/toast.server";

import {
  type ProviderName,
  ProviderNameSchema,
  providerNames,
} from "~/lib/validations";
import type { BreadcrumbHandle } from "./_layout";
import type { Route } from "./+types/connections";

export const handle: BreadcrumbHandle & SEOHandle = {
  breadcrumb: (
    <div className="flex items-center gap-2">
      <Link2 className="h-4 w-4" />
      <span>Connections</span>
    </div>
  ),
  getSitemapEntries: () => null,
};

async function userCanDeleteConnections(userId: string) {
  const user = await prisma.user.findUnique({
    select: {
      password: { select: { userId: true } },
      _count: { select: { connections: true } },
    },
    where: { id: userId },
  });
  // user can delete their connections if they have a password
  if (user?.password) return true;
  // users have to have more than one remaining connection to delete one
  return Boolean(user?._count.connections && user?._count.connections > 1);
}

export async function loader({ context }: Route.LoaderArgs) {
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });

  const timings = makeTimings("profile connections loader");
  const rawConnections = await prisma.connection.findMany({
    select: {
      id: true,
      providerName: true,
      providerId: true,
      createdAt: true,
      displayName: true,
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
  for (const connection of rawConnections) {
    const r = ProviderNameSchema.safeParse(connection.providerName);
    if (!r.success) continue;
    const providerName = r.data;
    connections.push({
      displayName: connection.displayName ?? "Unknown",
      providerName,
      id: connection.id,
      createdAtFormatted: connection.createdAt.toLocaleString(),
    });
  }

  return data(
    {
      connections,
      canDeleteConnections: await userCanDeleteConnections(userId),
    },
    { headers: { "Server-Timing": timings.toString() } }
  );
}

export const headers: Route.HeadersFunction = pipeHeaders;

export async function action({ request, context }: Route.ActionArgs) {
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });

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
  await prisma.connection.delete({
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

export default function Connections({ loaderData }: Route.ComponentProps) {
  return (
    <div className="mx-auto max-w-md">
      {loaderData.connections.length ? (
        <div className="flex flex-col gap-2">
          <p>Here are your current connections:</p>
          <ul className="flex flex-col gap-4">
            {loaderData.connections.map((c) => (
              <li key={c.id}>
                <Connection
                  canDelete={loaderData.canDeleteConnections}
                  connection={c}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>You don't have any connections yet.</p>
      )}
      <div className="mt-5 flex flex-col gap-5 border-border border-t-2 border-b-2 py-3">
        {providerNames.map((providerName) => (
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
  connection: Route.ComponentProps["loaderData"]["connections"][number];
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
          {connection.displayName} ({connection.createdAtFormatted})
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
