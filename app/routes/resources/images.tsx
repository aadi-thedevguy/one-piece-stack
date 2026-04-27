import { invariantResponse } from "@epic-web/invariant";
import { getImgResponse } from "openimg/node";
import { getSignedGetRequestInfo } from "~/lib/upload.server";
import { getDomainUrl } from "~/lib/utils";
import type { Route } from "./+types/images";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  const objectKey = searchParams.get("objectKey");
  let signedUrl: string | null = null;
  if (objectKey) {
    const { url } = await getSignedGetRequestInfo(objectKey);
    signedUrl = url;
  }

  return getImgResponse(request, {
    headers,
    allowlistedOrigins: [
      getDomainUrl(request),
      "https://api.dicebear.com",
      signedUrl ? new URL(signedUrl).origin : process.env.AWS_ENDPOINT_URL_S3,
    ].filter(Boolean),
    cacheFolder: "no_cache",
    getImgSource: async () => {
      if (signedUrl) {
        return {
          type: "fetch",
          url: signedUrl,
        };
      }

      const src = searchParams.get("src");
      invariantResponse(src, "src query parameter is required", {
        status: 400,
      });

      if (URL.canParse(src)) {
        // Fetch image from external URL; will be matched against allowlist
        return {
          type: "fetch",
          url: src,
        };
      }
      // Retrieve image from filesystem (public folder)
      if (src.startsWith("/assets")) {
        // Files managed by Vite
        return {
          type: "fs",
          path: `.${src}`,
        };
      }
      // Fallback to files in public folder
      return {
        type: "fs",
        path: `./public${src}`,
      };
    },
  });
}
