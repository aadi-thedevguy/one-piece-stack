import { createMiddleware } from "hono/factory";

function formatDuration(duration: number) {
  if (duration < 1000) return `${duration.toFixed(2)}ms`;
  if (duration < 60_000) return `${(duration / 1000).toFixed(2)}s`;
  if (duration < 3_600_000)
    return `${Math.floor(duration / 60_000)}min ${((duration % 60_000) / 1000).toFixed(2)}s`;
  return `${Math.floor(duration / 3_600_000)}h ${Math.floor((duration % 3_600_000) / 60_000)}min`;
}

function getUrl(url: URL) {
  if (url.pathname === "/__manifest") return url.pathname;
  return url.pathname + url.search;
}

export const epicLogger = (logger?: { logName?: string }) =>
  createMiddleware(async (c, next) => {
    const start = performance.now();
    const name = (logger?.logName ?? "EPIC LOGGER").toUpperCase();

    // Styles pour le terminal avec des couleurs
    const colors = {
      reset: "\x1b[0m",
      bold: "\x1b[1m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      red: "\x1b[31m",
      cyan: "\x1b[36m",
      magenta: "\x1b[35m",
    };

    const method = c.req.method;
    const url = getUrl(new URL(c.req.url));

    const epic = `${colors.bold}[🔍 ${"-".repeat(name.length)} 🔍]${colors.reset}`;
    console.log(`${epic} ${method} ${url}  Processing...`);

    await next();
    const duration = performance.now() - start;
    const status = c.res.status;

    // Générer une émotion basée sur le statut http
    const getEmotion = (status: number) => {
      if (status >= 200 && status < 300) return `🚀 ${name} 🚀`;
      if (status >= 400 && status < 500) return "😢 CLIENT ERROR 😢";
      if (status >= 500) return "🔥 SERVER ERROR 🔥";
      return "🔄 OTHER 🔄";
    };

    // Style des methodes HTTP
    const methodStyled = `${colors.bold}${method === "GET" ? colors.green : colors.yellow}${method}${colors.reset}`;
    const statusStyled = `${status >= 200 && status < 300 ? colors.green : status >= 400 && status < 500 ? colors.yellow : status >= 500 ? colors.red : colors.cyan}${status}${colors.reset}`;
    const emotion = getEmotion(status);
    const formattedDuration = formatDuration(duration);

    // Affichage final du log
    console.log(
      `${colors.magenta}[${emotion}]${colors.reset} ${methodStyled} ${url} ${statusStyled} (${formattedDuration})`
    );
  });
