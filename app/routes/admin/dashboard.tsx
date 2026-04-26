import { invariantResponse } from "@epic-web/invariant";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Ban,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from "lucide-react";
import type { Prisma, User } from "prisma/generated/client";
import { useEffect, useState } from "react";
import {
  type ActionFunctionArgs,
  data,
  Form,
  type LoaderFunctionArgs,
  redirect,
  useLoaderData,
  useSearchParams,
} from "react-router";
import { SearchBar } from "~/components/layout/search-bar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { userIdContext } from "~/context";
import { prisma } from "~/lib/db.server";
import { cancelSubscription } from "~/lib/payment.server";
import { redirectWithToast } from "~/lib/toast.server";
import { useDoubleCheck } from "~/lib/utils";
import { requireUserMiddleware } from "~/middleware.server";

export const middleware = [requireUserMiddleware];

export async function loader({ request, context }: LoaderFunctionArgs) {
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });

  // Verify admin privileges
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: { select: { name: true } } },
  });

  const isAdmin = user?.roles.some((role) => role.name === "admin");

  if (!isAdmin) {
    throw redirect("/");
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "all";
  const plan = url.searchParams.get("plan") || "all";
  const sort = url.searchParams.get("sort") || "createdAt";
  const order = url.searchParams.get("order") || "desc";
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = 5;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    id: { not: userId },
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status === "all" ? {} : { active: status === "active" }),
    ...(plan === "all"
      ? {}
      : {
          subscription: {
            plan: {
              name: plan,
            },
          },
        }),
  };

  // Fetch users, total count, and available plans for the filter
  const [users, total, plans] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      include: {
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
      orderBy: { [sort]: order },
      take: limit,
      skip,
    }),
    prisma.user.count({ where }),
    prisma.plan.findMany({ select: { name: true } }),
  ]);

  return data({ users, total, page, limit, search, status, plan, plans });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });

  // Verify admin
  const adminUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: { select: { name: true } } },
  });
  const isAdmin = adminUser?.roles.some((role) => role.name === "admin");
  invariantResponse(isAdmin, "Unauthorized", { status: 401 });

  const formData = await request.formData();
  const intent = formData.get("intent");
  const targetUserId = formData.get("userId") as string;

  invariantResponse(targetUserId, "Unauthorized", { status: 401 });

  if (intent === "ban") {
    // 1. Set user as inactive
    await prisma.user.update({
      where: { id: targetUserId },
      data: { active: false },
    });

    // 2. Cancel subscription if exists
    const subscription = await prisma.subscription.findUnique({
      where: { userId: targetUserId },
    });

    if (subscription && subscription.status === "active") {
      await cancelSubscription(subscription.id);
    }

    return redirectWithToast(
      request.headers.get("Referer") || "/admin/dashboard",
      {
        type: "success",
        title: "User Banned",
        description: "User has been deactivated and subscription cancelled.",
      }
    );
  }

  if (intent === "unban") {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { active: true },
    });

    return redirectWithToast(
      request.headers.get("Referer") || "/admin/dashboard",
      {
        type: "success",
        title: "User Unbanned",
        description: "User has been reactivated.",
      }
    );
  }

  return redirect(request.headers.get("Referer") || "/admin/dashboard");
}

export type UserData = User & {
  password: { userId: string } | null;
  connections: { providerName: string }[];
  passkey: { id: string }[];
  subscription: {
    status: string;
    plan: { name: string };
    price: { amount: number; currency: string; interval: string };
  } | null;
};

export const columns: ColumnDef<UserData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "username",
    header: "User",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.username}</span>
        <span className="text-muted-foreground text-xs">
          {row.original.email}
        </span>
      </div>
    ),
  },
  {
    id: "loginMethods",
    header: "Sign In Method",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.password && <Badge>Password</Badge>}
        {row.original.passkey.length > 0 && <Badge>Passkey</Badge>}
        {row.original.connections.map((c) => (
          <Badge key={c.providerName}>{c.providerName}</Badge>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        variant="ghost"
      >
        Joined
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.active ? "default" : "secondary"}>
        {row.original.active ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "plan",
    header: "Current Plan",
    cell: ({ row }) => {
      const sub = row.original.subscription;
      if (!sub)
        return <span className="text-muted-foreground text-sm">None</span>;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{sub.plan.name}</span>
          <span className="text-muted-foreground text-xs">
            {(sub.price.amount / 100).toLocaleString("en-US", {
              style: "currency",
              currency: sub.price.currency,
            })}
            /{sub.price.interval}
          </span>
        </div>
      );
    },
  },
  {
    id: "subscriptionStatus",
    header: "Subscription",
    cell: ({ row }) => {
      const sub = row.original.subscription;
      if (!sub) return <Badge variant="secondary">Inactive</Badge>;
      return (
        <Badge variant={sub.status === "active" ? "default" : "secondary"}>
          {sub.status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <UserActions user={row.original} />,
  },
];

export default function AdminUsersRoute() {
  const { users, total, page, limit, status, plan, plans } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const totalPages = Math.ceil(total / limit);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: users,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex: page - 1, pageSize: limit },
    },
  });

  // Sync sorting with URL
  useEffect(() => {
    if (sorting.length > 0) {
      const sort = sorting[0];
      const newParams = new URLSearchParams(searchParams);
      newParams.set("sort", sort.id);
      newParams.set("order", sort.desc ? "desc" : "asc");
      setSearchParams(newParams);
    }
  }, [sorting, searchParams, setSearchParams]);

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">User Management</h1>
        <p className="mt-2 text-muted-foreground">
          Overview of all registered users, their login methods, and
          subscription status.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchBar
          action="/admin/dashboard"
          autoFocus
          autoSubmit
          status="idle"
        />
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="capitalize" variant="outline">
                Status: {status === "all" ? "All" : status}{" "}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={status === "all"}
                onCheckedChange={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set("status", "all");
                  newParams.set("page", "1");
                  setSearchParams(newParams);
                }}
              >
                All Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={status === "active"}
                onCheckedChange={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set("status", "active");
                  newParams.set("page", "1");
                  setSearchParams(newParams);
                }}
              >
                Active
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={status === "inactive"}
                onCheckedChange={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set("status", "inactive");
                  newParams.set("page", "1");
                  setSearchParams(newParams);
                }}
              >
                Inactive
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="capitalize" variant="outline">
                Plan: {plan === "all" ? "All" : plan}{" "}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={plan === "all"}
                onCheckedChange={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set("plan", "all");
                  newParams.set("page", "1");
                  setSearchParams(newParams);
                }}
              >
                All Plans
              </DropdownMenuCheckboxItem>
              {plans.map((p) => (
                <DropdownMenuCheckboxItem
                  checked={plan === p.name}
                  key={p.name}
                  onCheckedChange={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set("plan", p.name);
                    newParams.set("page", "1");
                    setSearchParams(newParams);
                  }}
                >
                  {p.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="ml-auto" variant="outline">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  checked={column.getIsVisible()}
                  className="capitalize"
                  key={column.id}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-16 text-center">
          <h2 className="font-semibold text-xl">No users found</h2>
          <p className="text-muted-foreground">
            Try adjusting your filters or search query to find what you're
            looking for.
          </p>
        </div>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    key={row.id}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    className="h-24 text-center"
                    colSpan={columns.length}
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          disabled={!table.getCanPreviousPage()}
          onClick={() => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set("page", String(page - 1));
            setSearchParams(newParams);
          }}
          size="icon"
          title="Previous"
          variant="outline"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-muted-foreground text-sm">
          Page {page} of {totalPages || 1}
        </div>
        <Button
          disabled={!table.getCanNextPage()}
          onClick={() => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set("page", String(page + 1));
            setSearchParams(newParams);
          }}
          size="icon"
          title="Next"
          variant="outline"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
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
  const dcCancel = useDoubleCheck();

  return (
    <div className="flex gap-2">
      {user.subscription?.status === "active" && (
        <Form action="/resources/subscription/cancel" method="POST">
          <input name="userId" type="hidden" value={user.id} />
          <Button
            size="icon"
            variant={dcCancel.doubleCheck ? "destructive" : "outline"}
            {...dcCancel.getButtonProps({
              title: dcCancel.doubleCheck
                ? "Are you sure?"
                : "Cancel Subscription",
            })}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </Form>
      )}
      {user.active && (
        <Form method="POST">
          <input name="intent" type="hidden" value="ban" />
          <input name="userId" type="hidden" value={user.id} />
          <Button size="icon" title="Ban User" variant="secondary">
            <Ban className="h-4 w-4" />
          </Button>
        </Form>
      )}
      {!user.active && (
        <Form method="POST">
          <input name="intent" type="hidden" value="unban" />
          <input name="userId" type="hidden" value={user.id} />
          <Button size="icon" title="Unban User">
            <CheckCircle className="h-4 w-4" />
          </Button>
        </Form>
      )}
    </div>
  );
}
