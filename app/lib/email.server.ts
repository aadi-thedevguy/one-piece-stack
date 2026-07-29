import type { ReactElement } from "react";
import { render } from "react-email";
import { z } from "zod";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { inngest } from "~/lib/inngest.server";

const sesErrorSchema = z.object({
  name: z.string(),
  message: z.string(),
  statusCode: z.number(),
  cause: z.any().optional(),
});
type SesError = z.infer<typeof sesErrorSchema>;

const sesSuccessSchema = z.object({
  MessageId: z.string(),
});

export async function sendEmail({
  react,
  ...options
}: {
  to: string;
  subject: string;
} & (
  | { html: string; text: string; react?: never }
  | { react: ReactElement; html?: never; text?: never }
)) {
  const from = process.env.EMAIL_FROM;

  const email = {
    from,
    ...options,
    ...(react ? await renderReactEmail(react) : null),
  };

  try {
    await inngest.send({
      name: "email/send",
      data: email,
    });

    return {
      status: "success",
      data: { id: "queued" },
    } as const;
  } catch (error) {
    return {
      status: "error",
      error: {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : "Unknown Error",
        statusCode: 500,
      },
    } as const;
  }
}

function getSesClient() {
  return new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });
}

export async function processEmail(email: Record<string, any>) {
  const { to, from, subject, html, text } = email;

  const command = new SendEmailCommand({
    Source: from,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: html
          ? {
              Data: html,
              Charset: "UTF-8",
            }
          : undefined,
        Text: text
          ? {
              Data: text,
              Charset: "UTF-8",
            }
          : undefined,
      },
    },
  });

  const client = getSesClient();

  try {
    const response = await client.send(command);
    const parsedData = sesSuccessSchema.safeParse(response);

    if (parsedData.success) {
      return {
        status: "success",
        data: parsedData,
      } as const;
    }

    return {
      status: "error",
      error: {
        name: "UnknownError",
        message: "Unknown Error",
        statusCode: 500,
        cause: response,
      } satisfies SesError,
    } as const;
  } catch (error) {
    return {
      status: "error",
      error: {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : "Unknown Error",
        statusCode: 500,
        cause: error,
      } satisfies SesError,
    } as const;
  }
}

async function renderReactEmail(react: ReactElement) {
  const [html, text] = await Promise.all([
    render(react, { pretty: true }),
    render(react, { plainText: true, pretty: true }),
  ]);
  return { html, text };
}
