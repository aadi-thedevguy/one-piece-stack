import { parseWithZod } from "@conform-to/zod";
import { invariantResponse } from "@epic-web/invariant";
import { createId as cuid } from "@paralleldrive/cuid2";
import { data } from "react-router";
import { z } from "zod";
import { userIdContext } from "~/context";
import { cache } from "~/lib/cache.server";
import { prisma } from "~/lib/db.server";
import { redirectWithToast } from "~/lib/toast.server";
import type { Route } from "./+types/$noteId_.edit";
import {
  NoteEditor,
  ErrorBoundary as NoteEditorErrorBoundary,
  NoteEditorSchema,
} from "./note-editor";

export async function loader({ params, context }: Route.LoaderArgs) {
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });

  const note = await prisma.note.findUnique({
    where: { id: params.noteId, ownerId: userId },
    select: {
      id: true,
      title: true,
      content: true,
      ownerId: true,
    },
  });

  invariantResponse(note, "Not found", { status: 404 });
  return { note };
}

export async function action({ request, context }: Route.ActionArgs) {
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: NoteEditorSchema.superRefine(async (data, ctx) => {
      if (!data.id) return;

      const note = await prisma.note.findUnique({
        select: { id: true },
        where: { id: data.id, ownerId: userId },
      });
      if (!note) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Note not found",
        });
      }
    }).transform(async (data) => {
      const noteId = data.id ?? cuid();
      return {
        ...data,
        id: noteId,
      };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return data(
      { result: submission.reply() },
      { status: submission.status === "error" ? 400 : 200 }
    );
  }

  const { id: noteId, title, content } = submission.value;

  const updatedNote = await prisma.note.upsert({
    select: { id: true, owner: { select: { username: true } } },
    where: { id: noteId },
    create: {
      id: noteId,
      ownerId: userId,
      title,
      content,
    },
    update: {
      title,
      content,
    },
  });

  await cache.delete(`note:${noteId}`);
  await cache.delete(`user-notes:${userId}`);

  return redirectWithToast(`/notes/${updatedNote.id}`, {
    type: "success",
    title: "Success",
    description: "Your note has been updated.",
  });
}

export default function NoteEditRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <NoteEditor actionData={actionData} edit={true} note={loaderData.note} />
  );
}
export function ErrorBoundary() {
  return <NoteEditorErrorBoundary />;
}
