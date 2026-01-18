import { generateRobotsTxt } from "@nasa-gcn/remix-seo";
import { getDomainUrl } from "~/lib/utils";
import type { Route } from "./+types/robots[.]txt"

export function loader({ request }: Route.LoaderArgs) {
  return generateRobotsTxt([
    { type: "sitemap", value: `${getDomainUrl(request)}/sitemap.xml` },
  ]);
}
