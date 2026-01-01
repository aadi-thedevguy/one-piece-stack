import DodoPayments from "dodopayments";

// This will be initialized only once per server instance.
export const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
});
