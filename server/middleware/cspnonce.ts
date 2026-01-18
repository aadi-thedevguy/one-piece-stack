import crypto from "node:crypto";
import { createMiddleware } from "hono/factory";

// Middleware pour générer un nonce CSP
export const cspNonceMiddleware = createMiddleware<{
  Variables: { cspNonce: string };
}>(async (c, next) => {
  const nonce = crypto.randomBytes(16).toString("hex");
  c.set("cspNonce", nonce); // Ajout dans les en-têtes pour l'utilisation
  await next();
});
