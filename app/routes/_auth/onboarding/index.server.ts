import { invariant } from "@epic-web/invariant";
import { redirect } from "react-router";
import { onboardingEmailSessionKey } from "~/constants/keys";
import { verifySessionStorage } from "~/lib/auth/verification.server";
import type { VerifyFunctionArgs } from "../verify.server";

export async function handleVerification({ submission }: VerifyFunctionArgs) {
  invariant(
    submission.status === "success",
    "Submission should be successful by now"
  );
  const verifySession = await verifySessionStorage.getSession();
  verifySession.set(onboardingEmailSessionKey, submission.value.target);
  return redirect("/onboarding", {
    headers: {
      "set-cookie": await verifySessionStorage.commitSession(verifySession),
    },
  });
}
