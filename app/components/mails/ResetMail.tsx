import * as E from "@react-email/components";

type Props = {
  username: string;
  href: string;
};

const baseUrl = process.env.SERVER_URL ?? "http://localhost:3000";

export const ResetEmail = ({ username, href }: Props) => (
  <E.Html>
    <E.Head />
    <E.Preview>One Piece App - reset your password</E.Preview>
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
            Someone recently requested a password change for your account. If
            this was you, you can set a new password here:
          </E.Text>
          <E.Button href={href} style={button}>
            Reset password
          </E.Button>
          <E.Text style={text}>
            If you don&apos;t want to change your password or didn&apos;t
            request this, just ignore and delete this message.
          </E.Text>
          <E.Text style={text}>
            To keep your account secure, please don&apos;t forward this email to
            anyone.
          </E.Text>
          <E.Text style={text}>Have a great Day!</E.Text>
        </E.Section>
      </E.Container>
    </E.Body>
  </E.Html>
);

export const ResetEmailHtml = async (props: Props) =>
  await E.render(<ResetEmail {...props} />, { pretty: true });

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
