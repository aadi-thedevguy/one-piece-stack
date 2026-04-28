import * as E from "react-email";
import {
  bannerImage,
  baseUrl,
  button,
  container,
  headingStyles,
  main,
  paragraphStyles,
} from "./mail-constants";

interface Props {
  href: string;
  username: string;
}

export const DeleteAccountEmail = ({ username, href }: Props) => (
  <E.Html>
    <E.Head />
    <E.Preview>One Piece App - delete your account</E.Preview>
    <E.Body style={main}>
      <E.Container style={container}>
        <E.Img
          alt="Banner Image"
          src={`${baseUrl}/mail/account-delete.jpeg`}
          style={bannerImage}
        />
        <E.Section>
          <E.Heading style={headingStyles}>Hi {username},</E.Heading>
          <E.Text style={paragraphStyles}>
            We're sorry to see you go! Please confirm your account deletion by
            clicking the button below:
          </E.Text>
          <E.Text style={paragraphStyles}>
            This link will expire in 24 hours.
          </E.Text>
          <E.Button href={href} style={button}>
            Delete account
          </E.Button>
          <E.Text style={paragraphStyles}>
            Best regards,
            <br />
            One Piece App
          </E.Text>
        </E.Section>
      </E.Container>
    </E.Body>
  </E.Html>
);

export default DeleteAccountEmail;
