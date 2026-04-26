import * as E from "@react-email/components";

interface EmailTemplateProps {
  onboardingUrl: string;
  otp: string;
}

export function ForgotPasswordEmail({
  onboardingUrl,
  otp,
}: EmailTemplateProps) {
  return (
    <E.Html dir="ltr" lang="en">
      <E.Head />
      <E.Body style={main}>
        <E.Container style={container}>
          <h1>
            <E.Text>One Piece App - Password Reset</E.Text>
          </h1>
          <E.Text style={paragraph}>
            Here&apos;s your verification code: <strong>{otp}</strong>
          </E.Text>
          <E.Text style={paragraph}>Or click the link:</E.Text>
          <E.Link href={onboardingUrl}>{onboardingUrl}</E.Link>
        </E.Container>
      </E.Body>
    </E.Html>
  );
}

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
};
