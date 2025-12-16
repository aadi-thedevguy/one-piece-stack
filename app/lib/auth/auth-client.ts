import { dodopaymentsClient } from "@dodopayments/better-auth";
import {
  adminClient,
  inferAdditionalFields,
  usernameClient,
  // organizationClient,
} from "better-auth/client/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  userAc,
} from "better-auth/plugins/admin/access";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth.server";

export const ac = createAccessControl(defaultStatements);

export const user = ac.newRole({
  ...userAc.statements,
  user: [...userAc.statements.user, "list"],
});

export const admin = ac.newRole(adminAc.statements);

export const authClient = createAuthClient({
  baseURL: process.env.SERVER_URL,
  plugins: [
    inferAdditionalFields<typeof auth>(),
    adminClient({
      ac,
      roles: {
        admin,
        user,
      },
    }),
    usernameClient(),
    dodopaymentsClient(),
  ],
});
