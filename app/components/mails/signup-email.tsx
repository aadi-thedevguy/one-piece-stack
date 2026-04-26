import * as E from "@react-email/components";

interface EmailTemplateProps {
  onboardingUrl: string;
  otp: string;
}

const baseUrl = process.env.SERVER_URL ?? "http://localhost:3000";

export const SignupEmail = ({ onboardingUrl, otp }: EmailTemplateProps) => (
  <E.Html>
    <E.Head />
    <E.Body style={main}>
      <E.Container style={container}>
        <E.Img alt="" height="150" src={baseUrl + "/preview.png"} width="150" />
        <h1>
          <E.Text style={paragraph}>Welcome to One Piece App.</E.Text>
        </h1>
        <E.Text style={paragraph}>
          Here's your verification code: <strong>{otp}</strong>
        </E.Text>
        <E.Hr />
        <E.Text style={paragraph}>
          Or click the link to get started:
          <E.Link href={onboardingUrl}>{onboardingUrl}</E.Link>
        </E.Text>
        <E.Text style={paragraph}>
          Best,
          <br />
          TheDevGuy
        </E.Text>
      </E.Container>
    </E.Body>
  </E.Html>
);

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
