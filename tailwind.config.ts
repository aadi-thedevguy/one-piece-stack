import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      typography: () => ({
        DEFAULT: {
          css: {
            color: "var(--foreground)",
            "ul > li": {
              position: "relative",
            },
            "ul > li::before": {
              content: "'👉'",
              listStyleType: "none",
              position: "absolute",
              left: "-1.5rem",
            },
            blockquote: {
              borderLeftColor: "var(--border)",
              color: "var(--foreground)",
            },
            em: {
              color: "var(--foreground)",
            },
            strong: {
              color: "var(--foreground)",
            },
          },
        },
      }),
    },
  },
} satisfies Config;

export default config;
