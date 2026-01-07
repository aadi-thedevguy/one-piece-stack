import {
  data,
  type LoaderFunctionArgs,
  redirect,
  useLoaderData,
} from "react-router";
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
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
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
              <TableHead>User Details</TableHead>
              <TableHead>Authentication</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead>Subscription Plan</TableHead>
              <TableHead>Status</TableHead>
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
                          ? "success"
                          : "warning"
                      }
                    >
                      {user.subscription.status}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "success" | "warning";
}) {
  const variants = {
    default:
      "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary:
      "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    success:
      "border-transparent bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25",
    warning:
      "border-transparent bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/25",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
