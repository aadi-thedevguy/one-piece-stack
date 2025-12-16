import * as E from "@react-email/components";

type EmailTemplateProps = {
  redirectUrl: string;
  // otp: string;
};

export function ForgotPasswordEmail({ redirectUrl }: EmailTemplateProps) {
  return (
    <E.Html dir="ltr" lang="en">
      <E.Container>
        <h1>
          <E.Text>One Piece Stack Password Reset</E.Text>
        </h1>
        {/* <p>
          <E.Text>
            Here&apos;s your verification code: <strong>{otp}</strong>
          </E.Text>
        </p> */}
        <p>
          <E.Text>Or click the link:</E.Text>
        </p>
        <E.Link href={redirectUrl}>{redirectUrl}</E.Link>
      </E.Container>
    </E.Html>
  );
}

export async function ForgotPasswordEmailHtml(props: EmailTemplateProps) {
  return await E.render(<ForgotPasswordEmail {...props} />, { pretty: true });
}
