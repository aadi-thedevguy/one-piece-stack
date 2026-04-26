const MODE = process.env.NODE_ENV ?? "development";
const ALLOW_INDEXING = process.env.ALLOW_INDEXING !== "false";
const IS_DEV = MODE === "development";

const IS_PROD = MODE === "production";

export { ALLOW_INDEXING, IS_DEV, IS_PROD };
