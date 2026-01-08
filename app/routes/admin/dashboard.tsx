import { Ban, CheckCircle, XCircle } from "lucide-react";
import {
  data,
  type LoaderFunctionArgs,
  redirect,
  useFetcher,
  useLoaderData,
} from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db.server";
import { useDoubleCheck } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  // Verify admin privileges
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: { select: { name: true } } },
  });

  const isAdmin = user?.roles.some((role) => role.name === "admin");

  if (!isAdmin) {
    throw redirect("/");
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: userId },
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      active: true,
      createdAt: true,
      password: { select: { userId: true } },
      connections: { select: { providerName: true } },
      passkey: { select: { id: true } },
      subscription: {
        select: {
          status: true,
          plan: { select: { name: true } },
          price: { select: { interval: true, amount: true, currency: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return data({ users });
}

export default function AdminUsersRoute() {
  const { users } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">User Management</h1>
        <p className="mt-2 text-muted-foreground">
          Overview of all registered users, their login methods, and
          subscription status.
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Sign In Method</TableHead>
              <TableHead>Joined On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.username}</span>
                    <span className="text-muted-foreground text-xs">
                      {user.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.password && <Badge>Password</Badge>}
                    {user.passkey.length > 0 && <Badge>Passkey</Badge>}
                    {user.connections.map((c) => (
                      <Badge key={c.providerName}>{c.providerName}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {user.active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.subscription ? (
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {user.subscription.plan.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {(user.subscription.price.amount / 100).toLocaleString(
                          "en-US",
                          {
                            style: "currency",
                            currency: user.subscription.price.currency,
                          }
                        )}
                        /{user.subscription.price.interval}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Free Plan
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {user.subscription ? (
                    <Badge
                      variant={
                        user.subscription.status === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {user.subscription.status}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <UserActions user={user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function UserActions({
  user,
}: {
  user: {
    id: string;
    active: boolean;
    subscription: { status: string; plan: { name: string } } | null;
  };
}) {
  const cancelFetcher = useFetcher();
  const banFetcher = useFetcher();
  const unbanFetcher = useFetcher();
  const dcCancel = useDoubleCheck();
  const dcBan = useDoubleCheck();

  return (
    <div className="flex flex-col gap-2">
      {user.subscription?.status === "active" && (
        <cancelFetcher.Form
          action="/resources/subscription/cancel"
          method="POST"
        >
          <input name="userId" type="hidden" value={user.id} />
          <Button
            size="sm"
            variant={dcCancel.doubleCheck ? "destructive" : "ghost"}
            {...dcCancel.getButtonProps({
              className: "h-8 px-2",
              title: "Cancel Subscription",
            })}
          >
            <span>{dcCancel.doubleCheck ? "Are you sure?" : "Cancel Sub"}</span>
            <XCircle className="ml-1 h-4 w-4" />
          </Button>
        </cancelFetcher.Form>
      )}
      {user.active && (
        <banFetcher.Form action="/resources/admin/user-actions" method="POST">
          <input name="intent" type="hidden" value="ban" />
          <input name="userId" type="hidden" value={user.id} />
          <Button
            className="m-2"
            size="sm"
            variant={dcBan.doubleCheck ? "destructive" : "default"}
            {...dcBan.getButtonProps({
              title: "Ban User",
            })}
          >
            <span>{dcBan.doubleCheck ? "Are you sure?" : "Ban User"}</span>
            <Ban className="ml-1 h-4 w-4" />
          </Button>
        </banFetcher.Form>
      )}
      {!user.active && (
        <unbanFetcher.Form action="/resources/admin/user-actions" method="POST">
          <input name="intent" type="hidden" value="unban" />
          <input name="userId" type="hidden" value={user.id} />
          <Button className="m-2" size="sm">
            <span>Unban User</span>
            <CheckCircle className="ml-1 h-4 w-4" />
          </Button>
        </unbanFetcher.Form>
      )}
    </div>
  );
}
