import * as E from "@react-email/components";

type EmailTemplateProps = {
  verifyUrl: string;
  otp: string;
};

export function EmailChangeEmail({ verifyUrl, otp }: EmailTemplateProps) {
  return (
    <E.Html dir="ltr" lang="en">
      <E.Head />
      <E.Body style={main}>
        <E.Container style={container}>
          <h1>
            <E.Text>One Piece App - Email Change</E.Text>
          </h1>
          <E.Text style={paragraph}>
            Here&apos;s your verification code: <strong>{otp}</strong>
          </E.Text>
          <E.Text style={paragraph}>
            Click the link to verify your email:
            <E.Link href={verifyUrl}>{verifyUrl}</E.Link>
          </E.Text>
        </E.Container>
      </E.Body>
    </E.Html>
  );
}
export function EmailChangeNoticeEmail({ userId }: { userId: string }) {
  return (
    <E.Html dir="ltr" lang="en">
      <E.Head />
      <E.Body style={main}>
        <E.Container style={container}>
          <h1>
            <E.Text>Your One Piece App email has been changed</E.Text>
          </h1>
          <E.Text style={paragraph}>
            We're writing to let you know that your Epic Notes email has been
            changed.
          </E.Text>
          <E.Text style={paragraph}>
            If you changed your email address, then you can safely ignore this.
            But if you did not change your email address, then please contact
            support immediately.
          </E.Text>
          <E.Text style={paragraph}>
            If you changed your email address, then you can safely ignore this.
            But if you did not change your email address, then please contact
            support immediately.
          </E.Text>
          <E.Hr />
          <E.Text style={paragraph}>Your Account ID: {userId}</E.Text>
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
