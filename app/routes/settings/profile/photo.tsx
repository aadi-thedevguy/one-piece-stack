import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { invariantResponse } from "@epic-web/invariant";
import { parseFormData } from "@mjackson/form-data-parser";
import type { SEOHandle } from "@nasa-gcn/remix-seo";
import { AvatarIcon } from "@radix-ui/react-icons";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { data, Form, redirect, useNavigation } from "react-router";
import { z } from "zod";
import { ErrorList } from "~/components/layout/forms";
import { StatusButton } from "~/components/layout/status-button";
import { Button } from "~/components/ui/button";
import { userIdContext } from "~/context";
import { prisma } from "~/lib/db.server";
import { uploadProfileImage } from "~/lib/upload.server";
import { getUserImgSrc, useDoubleCheck, useIsPending } from "~/lib/utils";
import type { BreadcrumbHandle } from "./_layout";
import type { Route } from "./+types/photo.ts";

export const handle: BreadcrumbHandle & SEOHandle = {
  breadcrumb: (
    <div className="flex items-center gap-2">
      <AvatarIcon className="h-4 w-4" />
      <span>Photo</span>
    </div>
  ),
  getSitemapEntries: () => null,
};

const MAX_SIZE = 1024 * 1024 * 3; // 3MB

const DeleteImageSchema = z.object({
  intent: z.literal("delete"),
});

const NewImageSchema = z.object({
  intent: z.literal("submit"),
  photoFile: z
    .instanceof(File)
    .refine((file) => file.size > 0, "Image is required")
    .refine(
      (file) => file.size <= MAX_SIZE,
      "Image size must be less than 3MB"
    ),
});

const PhotoFormSchema = z.discriminatedUnion("intent", [
  DeleteImageSchema,
  NewImageSchema,
]);

export async function loader({ context }: Route.LoaderArgs) {
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      image: { select: { objectKey: true } },
    },
  });
  invariantResponse(user, "User not found", { status: 404 });
  return { user };
}

export async function action({ request, context }: Route.ActionArgs) {
  const userId = context.get(userIdContext) as string;
  invariantResponse(Boolean(userId), "Unauthorized", { status: 401 });

  const formData = await parseFormData(request, { maxFileSize: MAX_SIZE });
  const submission = await parseWithZod(formData, {
    schema: PhotoFormSchema.transform(async (data) => {
      if (data.intent === "delete") return { intent: "delete" };
      if (data.photoFile.size <= 0) return z.NEVER;
      return {
        intent: data.intent,
        image: {
          objectKey: await uploadProfileImage(userId, data.photoFile),
        },
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

  const { image, intent } = submission.value;

  if (intent === "delete") {
    await prisma.userImage.deleteMany({ where: { userId } });
    return redirect("/settings/profile");
  }

  await prisma.$transaction(async ($prisma) => {
    await $prisma.userImage.deleteMany({ where: { userId } });
    await $prisma.user.update({
      where: { id: userId },
      data: { image: { create: image } },
    });
  });

  return redirect("/settings/profile");
}

export default function PhotoRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const doubleCheckDeleteImage = useDoubleCheck();

  const navigation = useNavigation();

  const [form, fields] = useForm({
    id: "profile-photo",
    constraint: getZodConstraint(PhotoFormSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: PhotoFormSchema });
    },
    shouldRevalidate: "onBlur",
  });

  const isPending = useIsPending();
  const pendingIntent = isPending ? navigation.formData?.get("intent") : null;
  const lastSubmissionIntent = fields.intent.value;

  const [newImageSrc, setNewImageSrc] = useState<string | null>(null);

  return (
    <div>
      <Form
        className="flex flex-col items-center justify-center gap-10"
        encType="multipart/form-data"
        method="POST"
        onReset={() => setNewImageSrc(null)}
        {...getFormProps(form)}
      >
        <img
          alt={loaderData.user?.name ?? loaderData.user?.username}
          className="size-52 rounded-full object-cover"
          height={200}
          src={
            newImageSrc ??
            (loaderData.user
              ? getUserImgSrc(loaderData.user.image?.objectKey)
              : "")
          }
          width={200}
        />
        <ErrorList errors={fields.photoFile.errors} id={fields.photoFile.id} />
        <div className="flex gap-4">
          {/*
						We're doing some kinda odd things to make it so this works well
						without JavaScript. Basically, we're using CSS to ensure the right
						buttons show up based on the input's "valid" state (whether or not
						an image has been selected). Progressive enhancement FTW!
					*/}
          <input
            {...getInputProps(fields.photoFile, { type: "file" })}
            accept="image/*"
            className="peer sr-only"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  setNewImageSrc(event.target?.result?.toString() ?? null);
                };
                reader.readAsDataURL(file);
              }
            }}
            required
            tabIndex={newImageSrc ? -1 : 0}
          />
          <Button
            asChild
            className="cursor-pointer peer-valid:hidden peer-focus-within:ring-2 peer-focus-visible:ring-2"
          >
            <label
              className="flex items-center gap-2"
              htmlFor={fields.photoFile.id}
            >
              <Pencil className="h-4 w-4" />
              <span>Change</span>
            </label>
          </Button>
          <StatusButton
            className="peer-invalid:hidden"
            name="intent"
            status={
              pendingIntent === "submit"
                ? "pending"
                : lastSubmissionIntent === "submit"
                  ? (form.status ?? "idle")
                  : "idle"
            }
            type="submit"
            value="submit"
          >
            Save Photo
          </StatusButton>
          <Button
            className="flex items-center gap-2 peer-invalid:hidden"
            variant="destructive"
            {...form.reset.getButtonProps()}
          >
            <Trash2 className="h-4 w-4" />
            <span>Reset</span>
          </Button>
          {loaderData.user.image ? (
            <StatusButton
              className="peer-valid:hidden"
              variant="destructive"
              {...doubleCheckDeleteImage.getButtonProps({
                type: "submit",
                name: "intent",
                value: "delete",
              })}
              status={
                pendingIntent === "delete"
                  ? "pending"
                  : lastSubmissionIntent === "delete"
                    ? (form.status ?? "idle")
                    : "idle"
              }
            >
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span>
                  {doubleCheckDeleteImage.doubleCheck
                    ? "Are you sure?"
                    : "Delete"}
                </span>
              </div>
            </StatusButton>
          ) : null}
        </div>
        <ErrorList errors={form.errors} />
      </Form>
    </div>
  );
}
