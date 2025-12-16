import * as E from "@react-email/components";

type EmailTemplateProps = {
  onboardingUrl: string;
  // otp: string;
};

export function SignupEmail({ onboardingUrl }: EmailTemplateProps) {
  return (
    <E.Html dir="ltr" lang="en">
      <E.Container>
        <h1>
          <E.Text>Welcome to One Piece Stack!</E.Text>
        </h1>
        {/* <p>
          <E.Text>
            Here&apos;s your verification code: <strong>{otp}</strong>
          </E.Text>
        </p> */}
        <p>
          <E.Text>Or click the link to get started:</E.Text>
        </p>
        <E.Link href={onboardingUrl}>{onboardingUrl}</E.Link>
      </E.Container>
    </E.Html>
  );
}

export const SignupEmailHtml = async (props: EmailTemplateProps) =>
  await E.render(<SignupEmail {...props} />, { pretty: true });
