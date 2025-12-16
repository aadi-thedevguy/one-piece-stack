import * as E from "@react-email/components";

type EmailTemplateProps = {
  verifyUrl: string;
  // otp: string;
};

export function EmailChangeEmail({ verifyUrl }: EmailTemplateProps) {
  return (
    <E.Html dir="ltr" lang="en">
      <E.Container>
        <h1>
          <E.Text>One Piece Stack Email Change</E.Text>
        </h1>
        {/* <p>
          <E.Text>
            Here&apos;s your verification code: <strong>{otp}</strong>
          </E.Text>
        </p> */}
        <p>
          <E.Text>Click the link to verify your email:</E.Text>
        </p>
        <E.Link href={verifyUrl}>{verifyUrl}</E.Link>
      </E.Container>
    </E.Html>
  );
}

export const EmailChangeEmailHtml = async (props: EmailTemplateProps) =>
  await E.render(<EmailChangeEmail {...props} />, { pretty: true });
