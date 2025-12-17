import { generateSitemap } from "@nasa-gcn/remix-seo";
import type { ServerBuild } from "react-router";
import { getDomainUrl } from "~/lib/utils";
import type { Route } from "./+types/sitemap[.]xml"

export async function loader({ request, context }: Route.LoaderArgs) {
  const serverBuild = (await context.serverBuild) as ServerBuild;
  return generateSitemap(request, serverBuild.routes, {
    siteUrl: getDomainUrl(request),
    headers: {
      "Cache-Control": `public, max-age=${60 * 5}`,
    },
  });
}
