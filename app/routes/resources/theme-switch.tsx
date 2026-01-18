import { getFormProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { invariantResponse } from "@epic-web/invariant";
import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import {
  type ActionFunctionArgs,
  data,
  redirect,
  useFetcher,
  useFetchers,
} from "react-router";
import { ServerOnly } from "remix-utils/server-only";
import { useHints } from "~/lib/client/client-hints";
import { useRequestInfo } from "~/lib/request-info";
import { setTheme, type Theme } from "~/lib/theme.server";
import { ThemeFormSchema } from "~/lib/validations";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, {
    schema: ThemeFormSchema,
  });

  invariantResponse(submission.status === "success", "Invalid theme received");

  const { theme, redirectTo } = submission.value;

  const responseInit = {
    headers: { "set-cookie": setTheme(theme) },
  };
  if (redirectTo) {
    return redirect(redirectTo, responseInit);
  }
  return data({ result: submission.reply() }, responseInit);
}

export function ThemeSwitch({
  userPreference,
}: {
  userPreference?: Theme | null;
}) {
  const fetcher = useFetcher<typeof action>();
  const requestInfo = useRequestInfo();

  const [form] = useForm({
    id: "theme-switch",
    lastResult: fetcher.data?.result,
  });

  const optimisticMode = useOptimisticThemeMode();
  const mode = optimisticMode ?? userPreference ?? "system";
  const nextMode =
    mode === "system" ? "light" : mode === "light" ? "dark" : "system";
  const modeLabel = {
    light: (
      <div>
        <span className="sr-only">Light</span>
        <SunIcon className="h-6 w-6" />
      </div>
    ),
    dark: (
      <div>
        <span className="sr-only">Dark</span>
        <MoonIcon className="h-6 w-6" />
      </div>
    ),
    system: (
      <div>
        <span className="sr-only">System</span>
        <LaptopIcon className="h-6 w-6" />
      </div>
    ),
  };

  return (
    <fetcher.Form
      method="POST"
      {...getFormProps(form)}
      action="/resources/theme-switch"
    >
      <ServerOnly>
        {() => (
          <input name="redirectTo" type="hidden" value={requestInfo.path} />
        )}
      </ServerOnly>
      <input name="theme" type="hidden" value={nextMode} />
      <div className="flex gap-2">
        <button
          className="flex h-8 w-8 cursor-pointer items-center justify-center"
          type="submit"
        >
          {modeLabel[mode]}
        </button>
      </div>
    </fetcher.Form>
  );
}

/**
 * If the user's changing their theme mode preference, this will return the
 * value it's being changed to.
 */
export function useOptimisticThemeMode() {
  const fetchers = useFetchers();
  const themeFetcher = fetchers.find(
    (f) => f.formAction === "/resources/theme-switch"
  );

  if (themeFetcher?.formData) {
    const submission = parseWithZod(themeFetcher.formData, {
      schema: ThemeFormSchema,
    });

    if (submission.status === "success") {
      return submission.value.theme;
    }
  }
}

/**
 * @returns the user's theme preference, or the client hint theme if the user
 * has not set a preference.
 */
export function useTheme() {
  const hints = useHints();
  const requestInfo = useRequestInfo();
  const optimisticMode = useOptimisticThemeMode();
  if (optimisticMode) {
    return optimisticMode === "system" ? hints.theme : optimisticMode;
  }
  return requestInfo.userPrefs.theme ?? hints.theme;
}
