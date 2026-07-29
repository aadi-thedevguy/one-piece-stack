import { getFormProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { invariantResponse } from "@epic-web/invariant";
import { formatDistanceToNow } from "date-fns";
import { ClockIcon, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { data, Form, Link } from "react-router";
import { z } from "zod";
import { GeneralErrorBoundary } from "~/components/layout/error-boundary";
import { ErrorList } from "~/components/layout/forms";
import { StatusButton } from "~/components/layout/status-button";
import { Button } from "~/components/ui/button";
import { floatingToolbarClassName } from "~/constants/keys.js";
import { userIdContext } from "~/context.js";
import { requireUserWithPermission } from "~/lib/auth/auth.server";
import { cache, cachified } from "~/lib/cache.server";
import { prisma } from "~/lib/db.server";
import { makeTimings } from "~/lib/timing.server";
import { redirectDocumentWithToast } from "~/lib/toast.server";
import { useIsPending, useOptionalUser, userHasPermission } from "~/lib/utils";
import type { Route } from "./+types/$noteId.ts";

export async function loader({ context, params }: Route.LoaderArgs) {
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });

  const timings = makeTimings("noteLoader");
  const note = await cachified({
    key: `note:${params.noteId}`,
    cache,
    timings,
    getFreshValue: () => {
      console.log(`[CACHE MISS] Fetching fresh note ${params.noteId} from DB`);
      return prisma.note.findUnique({
        where: { id: params.noteId },
        select: {
          id: true,
          title: true,
          content: true,
          ownerId: true,
          owner: { select: { username: true } },
          updatedAt: true,
        },
      });
    },
    ttl: 1000 * 60 * 5, // 5 minutes
    staleWhileRevalidate: 1000 * 60 * 5, // 5 minutes stale
  });

  invariantResponse(note, "Not found", { status: 404 });

  const date = new Date(note.updatedAt);
  const timeAgo = formatDistanceToNow(date);

  return data(
    { note, timeAgo },
    { headers: { "Server-Timing": timings.toString() } }
  );
}

const DeleteFormSchema = z.object({
  intent: z.literal("delete-note"),
  noteId: z.string(),
});

export async function action({ request, context }: Route.ActionArgs) {
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });

  const formData = await request.formData();
  const submission = parseWithZod(formData, {
    schema: DeleteFormSchema,
  });
  if (submission.status !== "success") {
    return data(
      { result: submission.reply() },
      { status: submission.status === "error" ? 400 : 200 }
    );
  }

  const { noteId } = submission.value;

  const note = await prisma.note.findFirst({
    select: { id: true, ownerId: true, owner: { select: { username: true } } },
    where: { id: noteId },
  });
  invariantResponse(note, "Not found", { status: 404 });

  const isOwner = note.ownerId === userId;
  await requireUserWithPermission(
    request,
    isOwner ? "delete:note:own" : "delete:note:any"
  );

  await prisma.note.delete({ where: { id: note.id } });
  await cache.delete(`note:${note.id}`);
  await cache.delete(`user-notes:${userId}`);

  return redirectDocumentWithToast("/notes", {
    type: "success",
    title: "Success",
    description: "Your note has been deleted.",
  });
}

export default function NoteRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const user = useOptionalUser();
  const isOwner = user?.id === loaderData.note.ownerId;
  const canDelete = userHasPermission(
    user,
    isOwner ? "delete:note:own" : "delete:note:any"
  );
  const displayBar = canDelete || isOwner;

  // Add ref for auto-focusing
  const sectionRef = useRef<HTMLElement>(null);

  // Focus the section when the note ID changes
  useEffect(() => {
    if (sectionRef.current) {
      sectionRef.current.focus();
    }
  }, []);

  return (
    <section
      aria-labelledby="note-title"
      className="absolute inset-0 flex flex-col px-10"
      ref={sectionRef}
      tabIndex={-1} // Make the section focusable without keyboard navigation
    >
      <h2 className="mb-2 pt-12 text-h2 lg:mb-6" id="note-title">
        {loaderData.note.title}
      </h2>
      <div className={`${displayBar ? "pb-24" : "pb-12"} overflow-y-auto`}>
        <p className="whitespace-break-spaces text-sm md:text-lg">
          {loaderData.note.content}
        </p>
      </div>
      {displayBar ? (
        <div className={floatingToolbarClassName}>
          <div className="flex items-center gap-2 text-foreground/90 text-sm max-[524px]:hidden">
            <span>{loaderData.timeAgo} ago</span>
            <ClockIcon className="h-4 w-4" />
          </div>
          <div className="grid flex-1 grid-cols-2 justify-end gap-2 md:gap-4 min-[525px]:flex">
            {canDelete ? (
              <DeleteNote actionData={actionData} id={loaderData.note.id} />
            ) : null}
            <Button
              asChild
              className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
            >
              <Link className="flex items-center gap-2" to="edit">
                <Pencil className="h-4 w-4" />
                <span className="max-md:hidden">Edit</span>
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function DeleteNote({
  id,
  actionData,
}: {
  id: string;
  actionData: Route.ComponentProps["actionData"] | undefined;
}) {
  const isPending = useIsPending();
  const [form] = useForm({
    id: "delete-note",
    lastResult: actionData?.result,
  });

  return (
    <Form method="POST" {...getFormProps(form)}>
      <input name="noteId" type="hidden" value={id} />
      <StatusButton
        className="w-full max-md:aspect-square max-md:px-0"
        disabled={isPending}
        name="intent"
        status={isPending ? "pending" : (form.status ?? "idle")}
        type="submit"
        value="delete-note"
        variant="destructive"
      >
        <span className="flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          <span className="max-md:hidden">Delete</span>
        </span>
      </StatusButton>
      <ErrorList errors={form.errors} id={form.errorId} />
    </Form>
  );
}

export const meta: Route.MetaFunction = ({ loaderData: data }) => {
  const displayName = data?.note.owner.username ?? "User";
  const noteTitle = data?.note.title ?? "Note";
  const noteContentsSummary =
    data && data.note.content.length > 100
      ? data?.note.content.slice(0, 97) + "..."
      : "No content";
  return [
    { title: `${noteTitle} | ${displayName}'s Notes | One Piece App Notes` },
    {
      name: "description",
      content: noteContentsSummary,
    },
  ];
};

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        403: () => <p>You are not allowed to do that</p>,
        404: ({ params }) => (
          <p>No note with the id "{params.noteId}" exists</p>
        ),
      }}
    />
  );
}
