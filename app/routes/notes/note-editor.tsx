import {
  FormProvider,
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Form } from "react-router";
import { z } from "zod";
import { GeneralErrorBoundary } from "~/components/layout/error-boundary";
import { ErrorList, Field, TextareaField } from "~/components/layout/forms";
import { StatusButton } from "~/components/layout/status-button";
import { Button } from "~/components/ui/button";
import { floatingToolbarClassName } from "~/constants/keys";
import { useIsPending } from "~/lib/utils";

export const NoteEditorSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(10_000),
});

export function NoteEditor({
  note,
  edit,
  actionData,
}: {
  note?: {
    id: string;
    title: string;
    content: string;
  };
  edit?: boolean;
  actionData?: { result?: any };
}) {
  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: "note-editor",
    constraint: getZodConstraint(NoteEditorSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: NoteEditorSchema });
    },
    defaultValue: {
      ...note,
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <div className="absolute inset-0">
      <FormProvider context={form.context}>
        <Form
          className="flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-10 pt-12 pb-28"
          method="POST"
          {...getFormProps(form)}
          encType="multipart/form-data"
        >
          {/*
					This hidden submit button is here to ensure that when the user hits
					"enter" on an input field, the primary form function is submitted
					rather than the first button in the form (which is delete/add image).
				*/}
          <button className="hidden" type="submit" />
          {note ? <input name="id" type="hidden" value={note.id} /> : null}
          <div className="flex flex-col gap-1">
            <Field
              errors={fields.title.errors}
              inputProps={{
                autoFocus: true,
                ...getInputProps(fields.title, { type: "text" }),
              }}
              labelProps={{ children: "Title" }}
            />
            <TextareaField
              errors={fields.content.errors}
              labelProps={{ children: "Content" }}
              textareaProps={{
                ...getTextareaProps(fields.content),
              }}
            />
          </div>
          <ErrorList errors={form.errors} id={form.errorId} />
        </Form>
        <div className={floatingToolbarClassName}>
          {!edit && (
            <Button variant="destructive" {...form.reset.getButtonProps()}>
              <span>Reset</span>
            </Button>
          )}
          <StatusButton
            disabled={isPending}
            form={form.id}
            status={isPending ? "pending" : "idle"}
            type="submit"
          >
            <span>Submit</span>
          </StatusButton>
        </div>
      </FormProvider>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        404: ({ params }) => (
          <p>No note with the id "{params.noteId}" exists</p>
        ),
        403: () => <p>You are not allowed to do that</p>,
      }}
    />
  );
}
