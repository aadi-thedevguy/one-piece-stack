import * as E from "@react-email/components";

interface Props {
  href: string;
  username: string;
}

const baseUrl = process.env.SERVER_URL ?? "http://localhost:3000";

export const DeleteAccountEmail = ({ username, href }: Props) => (
  <E.Html>
    <E.Head />
    <E.Preview>One Piece App - delete your account</E.Preview>
    <E.Body style={main}>
      <E.Container style={container}>
        <E.Img
          alt="Cover Image"
          height="80"
          src={baseUrl + "/preview.png"}
          width="80"
        />
        <E.Section>
          <E.Text style={text}>Hi {username},</E.Text>
          <E.Text style={text}>
            We're sorry to see you go! Please confirm your account deletion by
            clicking the button below:
          </E.Text>
          <E.Text style={text}>
            <p>This link will expire in 24 hours.</p>
          </E.Text>
          <E.Button href={href} style={button}>
            Delete account
          </E.Button>
          <E.Text style={text}>
            <p>
              Best regards,
              <br />
              Your App Team
            </p>
          </E.Text>
        </E.Section>
      </E.Container>
    </E.Body>
  </E.Html>
);

const main = {
  backgroundColor: "#f6f9fc",
  padding: "10px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #f0f0f0",
  padding: "45px",
};

const text = {
  fontSize: "16px",
  fontFamily:
    "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
  fontWeight: "300",
  color: "#404040",
  lineHeight: "26px",
};

const button = {
  backgroundColor: "#22c383",
  borderRadius: "4px",
  fontFamily: "'Open Sans', 'Helvetica Neue', Arial",
  fontSize: "16px",
  textDecoration: "none",
  display: "block",
  padding: "12px 12px",
  color: "#fff",
  textAlign: "center" as const,
};
