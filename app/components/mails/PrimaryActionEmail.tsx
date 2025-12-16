import * as E from "@react-email/components";

type EmailTemplateProps = {
  username: string;
};

const baseUrl = process.env.SERVER_URL ?? "http://localhost:3000";

export const PrimaryActionEmail = ({ username }: EmailTemplateProps) => (
  <E.Html>
    <E.Head />
    <E.Preview>Some good things about your store.</E.Preview>
    <E.Body style={main}>
      <E.Container style={container}>
        <E.Img alt="" height="150" src={baseUrl + "/preview.png"} width="150" />
        <E.Text style={paragraph}>Hi {username ?? "there"},</E.Text>
        <E.Text style={paragraph}>Welcome to One Piece App.</E.Text>
        <E.Text style={paragraph}>
          Thank you for signing up for our app! We're excited to have you on
          board.
        </E.Text>
        <E.Text style={paragraph}>
          Best,
          <br />
          The Shopaggator team
        </E.Text>
      </E.Container>
    </E.Body>
  </E.Html>
);

export const PrimaryActionEmailHtml = async (props: EmailTemplateProps) =>
  await E.render(<PrimaryActionEmail {...props} />, { pretty: true });

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
