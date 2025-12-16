import { generateRobotsTxt } from "@nasa-gcn/remix-seo";
import type { LoaderFunctionArgs } from "react-router";
import { getDomainUrl } from "~/lib/utils";

export function loader({ request }: LoaderFunctionArgs) {
  return generateRobotsTxt([
    { type: "sitemap", value: `${getDomainUrl(request)}/sitemap.xml` },
  ]);
}
