/* eslint-disable no-unused-vars */

import type { Submission } from "@conform-to/react";
import type { PlanLimit, Price } from "@prisma/client";
import type { z } from "zod";
import type { Currency, Interval, PlanId } from "~/constants/index";
import type { VerifySchema } from "~/lib/validations";

/**
 * A helper type that defines our price by interval.
 */
export type PriceInterval<
  I extends Interval = Interval,
  C extends Currency = Currency,
> = {
  [interval in I]: {
    [currency in C]: Price["amount"];
  };
};

/**
 * A helper type that defines our pricing plans structure by Interval.
 */
export type PricingPlan<T extends PlanId = PlanId> = {
  [key in T]: {
    planID: string;
    name: string;
    isPopular: boolean;
    description: string;
    features: string[];
    limits: Pick<PlanLimit, "maxItems">;
    prices: PriceInterval;
  };
};

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
