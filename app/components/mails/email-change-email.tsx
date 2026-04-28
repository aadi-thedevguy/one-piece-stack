import * as E from "react-email";
import {
  bannerImage,
  baseUrl,
  container,
  headingStyles,
  hr,
  linkStyle,
  main,
  paragraphStyles,
} from "./mail-constants";

interface EmailTemplateProps {
  otp: string;
  verifyUrl: string;
}

export function EmailChangeEmail({ verifyUrl, otp }: EmailTemplateProps) {
  return (
    <E.Html dir="ltr" lang="en">
      <E.Head />
      <E.Preview>One Piece App - Email Change</E.Preview>
      <E.Body style={main}>
        <E.Container style={container}>
          <E.Img
            alt="Email Change Banner"
            src={`${baseUrl}/mail/change-email.jpeg`}
            style={bannerImage}
          />
          <E.Heading style={headingStyles}>
            One Piece App - Email Change
          </E.Heading>
          <E.Text style={paragraphStyles}>
            Here&apos;s your verification code: <strong>{otp}</strong>
          </E.Text>
          <E.Hr style={hr} />
          <E.Text style={paragraphStyles}>
            Click the link to verify your email:
            <br />
            <E.Link href={verifyUrl} style={linkStyle}>
              {verifyUrl}
            </E.Link>
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
      <E.Preview>Your One Piece App email has been changed</E.Preview>
      <E.Body style={main}>
        <E.Container style={container}>
          <E.Img
            alt="Email Updated Banner"
            src={`${baseUrl}/mail/email-updated.jpeg`}
            style={bannerImage}
          />
          <E.Heading style={headingStyles}>
            Your One Piece App email has been changed
          </E.Heading>
          <E.Text style={paragraphStyles}>
            We're writing to let you know that your One Piece App email has been
            changed.
          </E.Text>
          <E.Text style={paragraphStyles}>
            If you changed your email address, then you can safely ignore this.
            But if you did not change your email address, then please contact
            support immediately.
          </E.Text>
          <E.Hr style={hr} />
          <E.Text style={paragraphStyles}>Your Account ID: {userId}</E.Text>
        </E.Container>
      </E.Body>
    </E.Html>
  );
}
