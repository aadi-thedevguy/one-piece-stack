import { auth } from "~/lib/auth/auth.server"; // Adjust the path as necessary
import type { Route } from "./+types/auth.$";

export async function loader({ request }: Route.LoaderArgs) {
  return auth.handler(request);
}

export async function action({ request }: Route.ActionArgs) {
  return auth.handler(request);
}
