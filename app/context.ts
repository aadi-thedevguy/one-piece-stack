import type { User as BetterAuthUser } from "better-auth/types";
import { createContext } from "react-router";

export type User = BetterAuthUser & {
  username: string | undefined;
};

// Holds the authenticated user's ID for routes protected by middleware
// export const userIdContext = createContext<string | null>(null);

export const userContext = createContext<User | null>(null);
