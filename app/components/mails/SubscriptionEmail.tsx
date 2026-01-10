import * as E from "@react-email/components";

type SubscriptionEmailProps = {
  userFirstName?: string;
  action: "created" | "cancelled" | "updated";
  planName?: string;
};

const baseUrl = process.env.SERVER_URL ?? "http://localhost:3000";

const getEmailContent = (
  action: SubscriptionEmailProps["action"],
  userFirstName: string,
  planName?: string
) => {
  switch (action) {
    case "created":
      return {
        preview: "Your subscription has been confirmed!",
        heading: `Welcome aboard, ${userFirstName}!`,
        paragraph: `You've successfully subscribed to the ${planName} plan. We're thrilled to have you. You can now access all the premium features.`,
        buttonText: "Go to Dashboard",
      };
    case "cancelled":
      return {
        preview: "Your subscription has been cancelled.",
        heading: `Sorry to see you go, ${userFirstName}.`,
        paragraph: `Your subscription to the ${planName} plan has been successfully cancelled. Your access will continue until the end of the current billing period. We hope to see you back soon!`,
        buttonText: "View Plans",
      };
    case "updated":
      return {
        preview: "Your subscription has been updated.",
        heading: `Subscription Update Successful, ${userFirstName}!`,
        paragraph: `Your subscription has been successfully updated to the ${planName} plan.`,
        buttonText: "Go to Dashboard",
      };
    default:
      // Should not happen
      return {
        preview: "Update on your subscription.",
        heading: `Hello ${userFirstName},`,
        paragraph: "There has been an update to your subscription.",
        buttonText: "Go to Dashboard",
      };
  }
};

export const SubscriptionEmail = ({
  userFirstName = "there",
  action,
  planName = "our service",
}: SubscriptionEmailProps) => {
  const { preview, heading, paragraph, buttonText } = getEmailContent(
    action,
    userFirstName,
    planName
  );
  const actionLink = `${baseUrl}/my-profile`;

  return (
    <E.Html>
      <E.Head />
      <E.Preview>{preview}</E.Preview>
      <E.Body style={main}>
        <E.Container style={container}>
          <E.Img
            alt="One Piece Stack"
            height="50"
            src={`${baseUrl}/mail-sent.png`}
            style={logo}
            width="170"
          />
          <E.Heading style={headingStyles}>{heading}</E.Heading>
          <E.Text style={paragraphStyles}>{paragraph}</E.Text>
          <E.Section style={btnContainer}>
            <E.Button href={actionLink} style={button}>
              {buttonText}
            </E.Button>
          </E.Section>
          <E.Text style={paragraphStyles}>
            Best,
            <br />
            The One Piece Stack team
          </E.Text>
          <E.Hr style={hr} />
        </E.Container>
      </E.Body>
    </E.Html>
  );
};

export const SubscriptionEmailHtml = async (props: SubscriptionEmailProps) =>
  await E.render(<SubscriptionEmail {...props} />);
const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};

const logo = {
  margin: "0 auto",
};

const paragraphStyles = {
  fontSize: "16px",
  lineHeight: "26px",
};

const btnContainer = {
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#333",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
};

const hr = {
  borderColor: "#cccccc",
  margin: "20px 0",
};

const headingStyles = {
  color: "#000",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "24px",
  fontWeight: "normal",
  textAlign: "center" as const,
  margin: "30px 0",
  padding: "0",
};
