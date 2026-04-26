import type { ScriptHTMLAttributes } from "react";

declare global {
  interface Window {
    plausible: {
      (event: string, eventProps?: Record<string, unknown>): void;
      q?: unknown[];
    };
  }
}

interface PlausibleScriptProps extends ScriptHTMLAttributes<HTMLScriptElement> {
  domain: string;
  src: string;
}

const DOMAIN_REGEX = /^https?:\/\//;

export function PlausibleScript({
  domain,
  src,
  ...props
}: PlausibleScriptProps) {
  const strippedDomain = domain.replace(DOMAIN_REGEX, "");
  return (
    <>
      <script data-domain={strippedDomain} defer src={src} {...props} />
      <script
        {...props}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Intentional script injection for analytics
        dangerouslySetInnerHTML={{
          __html:
            "window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }",
        }}
        src={undefined}
      />
    </>
  );
}
