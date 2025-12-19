// import {
//   checkout,
//   dodopayments,
//   portal,
//   webhooks,
// } from "@dodopayments/better-auth";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { username } from "better-auth/plugins";
import { admin as adminPlugin } from "better-auth/plugins/admin";
import DodoPayments from "dodopayments";
import { DeleteAccountEmail } from "~/components/mails/DeleteAccountEmail";
import { EmailChangeEmail } from "~/components/mails/EmailChangeEmail";
import { PrimaryActionEmail } from "~/components/mails/PrimaryActionEmail";
import { ResetEmail } from "~/components/mails/ResetMail";
import { SignupEmail } from "~/components/mails/SignupEmail";
import { prisma } from "../db.server";
import { sendEmail } from "../email.server";
import { ac, admin, user } from "./auth-client";
// import type { WebhookPayload } from "dodopayments/resources/webhook-events.mjs";

export const dodoPayments = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: "test_mode",
});

export const auth = betterAuth({
  appName: "One Piece App",
  trustedOrigins: [process.env.CORS_ORIGIN],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  rateLimit: {
    enabled: true,
    window: 60, // time window in seconds
    max: 10, // max requests in the window
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ url, newEmail }) => {
        await sendEmail({
          to: newEmail,
          subject: "One Piece App - Email Change Verification",
          react: <EmailChangeEmail verifyUrl={url} />,
        });
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "One Piece App - Delete Account Verification",
          react: <DeleteAccountEmail href={url} username={user.name} />,
        });
      },
    },
    additionalFields: {},
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // biome-ignore lint/complexity/noVoid: <explanation>
      void sendEmail({
        to: user.email,
        subject: "Reset your password",
        react: <ResetEmail href={url} username={user.name} />,
      });
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      // biome-ignore lint/complexity/noVoid: <explanation>
      void sendEmail({
        to: user.email,
        subject: "Welcome to One Piece App",
        react: <SignupEmail onboardingUrl={url} />,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      mapProfileToUser: (profile) => ({
        name: profile.name,
        email: profile.email,
        image: profile.picture,
      }),
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: true,
      trustedProviders: ["google"],
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60, // 1 minute
    },
  },
  plugins: [
    username(),
    adminPlugin({
      ac,
      roles: {
        admin,
        user,
      },
    }),
    // dodopayments({
    //   client: dodoPayments,
    //   createCustomerOnSignUp: true,
    //   use: [
    //     checkout({
    //       products: [
    //         {
    //           productId: "pdt_xxxxxxxxxxxxxxxxxxxxx",
    //           slug: "premium-plan",
    //         },
    //       ],
    //       successUrl: "/dashboard/success",
    //       authenticatedUsersOnly: true,
    //     }),
    //     portal(),
    //     webhooks({
    //       webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
    //       onPayload: async (payload: unknown) => {
    //         console.log("Received webhook:", payload.event_type);
    //       },
    //     }),
    //   ],
    // }),
  ],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/sign-up")) {
        const user = ctx.context.newSession?.user ?? {
          name: ctx.body.name,
          email: ctx.body.email,
        };

        if (user != null) {
          await sendEmail({
            to: user.email,
            subject: "Welcome to One Piece App",
            react: <PrimaryActionEmail username={user.name} />,
          });
        }
      }
    }),
  },
  databaseHooks: {
    session: {
      create: {
        // before: async (userSession) => {
        // return {
        //   data: {
        //   },
        // };
        // },
      },
    },
  },
});
