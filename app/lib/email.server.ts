import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { ReactElement } from "react";
import { render } from "react-email";
import { z } from "zod";
import { inngest } from "~/lib/inngest.server";

const resendErrorSchema = z.union([
  z.object({
    name: z.string(),
    message: z.string(),
    statusCode: z.number(),
  }),
  z.object({
    name: z.literal("UnknownError"),
    message: z.literal("Unknown Error"),
    statusCode: z.literal(500),
    cause: z.any(),
  }),
]);

type ResendError = z.infer<typeof resendErrorSchema>;

const resendSuccessSchema = z.object({
  id: z.string(),
});

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

interface Email {
  from: string;
  html: string;
  subject: string;
  text: string;
  to: string;
}

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

export async function processEmail(email: Email) {
  switch (process.env.EMAIL_PROVIDER) {
    case "resend":
      return processEmailWithResend(email);

    case "ses":
      return processEmailWithSes(email);

    default:
      return null;
  }
}

async function processEmailWithResend(email: Email) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    body: JSON.stringify(email),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  const parsedData = resendSuccessSchema.safeParse(data);

  if (response.ok && parsedData.success) {
    return {
      status: "success",
      data: parsedData,
    } as const;
  }

  const parseResult = resendErrorSchema.safeParse(data);

  if (parseResult.success) {
    return {
      status: "error",
      error: parseResult.data,
    } as const;
  }

  return {
    status: "error",
    error: {
      name: "UnknownError",
      message: "Unknown Error",
      statusCode: 500,
      cause: data,
    } satisfies ResendError,
  } as const;
}

async function processEmailWithSes(email: Email) {
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
        Html: {
          Data: html,
          Charset: "UTF-8",
        },
        Text: {
          Data: text,
          Charset: "UTF-8",
        },
      },
    },
  });

  try {
    const response = await getSesClient().send(command);
    const parsedData = sesSuccessSchema.safeParse(response);

    if (parsedData.success) {
      return {
        status: "success",
        data: parsedData.data,
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

function getSesClient() {
  return new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

async function renderReactEmail(react: ReactElement) {
  const [html, text] = await Promise.all([
    render(react, { pretty: true }),
    render(react, { plainText: true, pretty: true }),
  ]);

  return { html, text };
}
