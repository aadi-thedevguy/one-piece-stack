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

export const SignupEmail = ({ onboardingUrl, otp }: EmailTemplateProps) => (
  <E.Html>
    <E.Head />
    <E.Preview>Welcome to One Piece App</E.Preview>
    <E.Body style={main}>
      <E.Container style={container}>
        <E.Img
          alt="Welcome Banner"
          src={`${baseUrl}/mail/onboarding-mail.jpeg`}
          style={bannerImage}
        />
        <E.Heading style={headingStyles}>Welcome to One Piece App.</E.Heading>
        <E.Text style={paragraphStyles}>
          Here's your verification code: <strong>{otp}</strong>
        </E.Text>
        <E.Hr style={hr} />
        <E.Text style={paragraphStyles}>
          Or click the link to get started:
          <br />
          <E.Link href={onboardingUrl} style={linkStyle}>
            {onboardingUrl}
          </E.Link>
        </E.Text>
        <E.Text style={paragraphStyles}>
          Best regards,
          <br />
          One Piece App
        </E.Text>
      </E.Container>
    </E.Body>
  </E.Html>
);
