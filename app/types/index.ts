/* eslint-disable no-unused-vars */

import type { Submission } from "@conform-to/react";
import type { z } from "zod";
import type { VerifySchema } from "~/lib/validations";

// Define a user type for cleaner typing
export interface ProviderUser {
  email: string;
  id: string;
  imageUrl?: string;
  name?: string;
  username?: string;
}

export interface VerifyFunctionArgs {
  body: FormData | URLSearchParams;
  request: Request;
  submission: Submission<
    z.input<typeof VerifySchema>,
    string[],
    z.output<typeof VerifySchema>
  >;
}
