import { invariant } from "@epic-web/invariant";
import { data } from "react-router";
import { EmailChangeNoticeEmail } from "~/components/mails/email-change-email";
import { verifySessionStorage } from "~/lib/auth/verification.server";
import { prisma } from "~/lib/db.server";
import { sendEmail } from "~/lib/email.server";
import { redirectWithToast } from "~/lib/toast.server";
import {
  requireRecentVerification,
  type VerifyFunctionArgs,
} from "~/routes/_auth/verify.server";
import { newEmailAddressSessionKey } from "./change-email";

export async function handleVerification({
  request,
  submission,
}: VerifyFunctionArgs) {
  await requireRecentVerification(request);
  invariant(
    submission.status === "success",
    "Submission should be successful by now"
  );

  const verifySession = await verifySessionStorage.getSession(
    request.headers.get("cookie")
  );
  const newEmail = verifySession.get(newEmailAddressSessionKey);
  if (!newEmail) {
    return data(
      {
        result: submission.reply({
          formErrors: [
            "You must submit the code on the same device that requested the email change.",
          ],
        }),
      },
      { status: 400 }
    );
  }
  const preUpdateUser = await prisma.user.findFirstOrThrow({
    select: { email: true },
    where: { id: submission.value.target },
  });
  const user = await prisma.user.update({
    where: { id: submission.value.target },
    select: { id: true, email: true, username: true },
    data: { email: newEmail },
  });

  sendEmail({
    to: preUpdateUser.email,
    subject: "One Piece App - Email changed",
    react: <EmailChangeNoticeEmail userId={user.id} />,
  });

  return redirectWithToast(
    "/settings/profile",
    {
      title: "Email Changed",
      type: "success",
      description: `Your email has been changed to ${user.email}`,
    },
    {
      headers: {
        "set-cookie": await verifySessionStorage.destroySession(verifySession),
      },
    }
  );
}
