import * as E from "react-email";
import {
  baseUrl,
  button,
  container,
  headingStyles,
  hr,
  main,
  paragraphStyles,
} from "./mail-constants";

interface SubscriptionEmailProps {
  action: "created" | "cancelled" | "updated";
  planName?: string;
  userFirstName?: string;
}

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
            alt="mail-sent"
            height="50"
            src={`${baseUrl}/mail/mail-sent.png`}
            style={{ marginBottom: "24px" }}
            width="170"
          />
          <E.Heading style={headingStyles}>{heading}</E.Heading>
          <E.Text style={paragraphStyles}>{paragraph}</E.Text>
          <E.Section>
            <E.Button href={actionLink} style={button}>
              {buttonText}
            </E.Button>
          </E.Section>
          <E.Text style={paragraphStyles}>
            Best regards,
            <br />
            One Piece App
          </E.Text>
          <E.Hr style={hr} />
        </E.Container>
      </E.Body>
    </E.Html>
  );
};

export const SubscriptionEmailHtml = async (props: SubscriptionEmailProps) =>
  await E.render(<SubscriptionEmail {...props} />);
