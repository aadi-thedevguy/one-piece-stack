import { Inngest } from "inngest";
import { processEmail } from "~/lib/email.server";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "one-piece-app" });

export const sendEmailBackground = inngest.createFunction(
  { id: "send-email-background", triggers: [{ event: "email/send" }] },
  async ({ event, step }) => {
    await step.run("execute-email-send", async () => {
      const response = await processEmail(event.data);
      if (response.status === "error") {
        throw new Error(response.error.message || "Failed to send email");
      }
      return response;
    });
  }
);

export const functions = [sendEmailBackground];
