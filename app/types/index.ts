/* eslint-disable no-unused-vars */

import type { Submission } from "@conform-to/react";
import type { z } from "zod";
import type { VerifySchema } from "~/lib/validations";

// Define a user type for cleaner typing
export type ProviderUser = {
  id: string;
  email: string;
  username?: string;
  name?: string;
  imageUrl?: string;
};

export type VerifyFunctionArgs = {
  request: Request;
  submission: Submission<
    z.input<typeof VerifySchema>,
    string[],
    z.output<typeof VerifySchema>
  >;
  body: FormData | URLSearchParams;
};
