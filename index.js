import "dotenv/config";
import * as fs from "node:fs";
import sourceMapSupport from "source-map-support";

// get source file without the `file://` prefix or `?t=...` suffix
const REGEXP = /^file:\/\/(.*)\?t=[.\d]+$/;

sourceMapSupport.install({
  retrieveSourceMap(source) {
    const match = source.match(REGEXP);
    if (match) {
      return {
        url: source,
        map: fs.readFileSync(`${match[1]}.map`, "utf8"),
      };
    }
    return null;
  },
});

if (process.env.NODE_ENV === "production") {
  await import("./build/server/index.js");
} else {
  await import("./server/index.ts");
}
