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
      <E.Preview>One Piece App - Password Reset</E.Preview>
      <E.Body style={main}>
        <E.Container style={container}>
          <E.Img
            alt="Password Reset Banner"
            src={`${baseUrl}/mail/forgot-password.jpeg`}
            style={bannerImage}
          />
          <E.Heading style={headingStyles}>
            One Piece App - Password Reset
          </E.Heading>
          <E.Text style={paragraphStyles}>
            Here&apos;s your verification code: <strong>{otp}</strong>
          </E.Text>
          <E.Hr style={hr} />
          <E.Text style={paragraphStyles}>Or click the link:</E.Text>
          <E.Link href={onboardingUrl} style={linkStyle}>
            {onboardingUrl}
          </E.Link>
        </E.Container>
      </E.Body>
    </E.Html>
  );
}
