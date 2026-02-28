import { type ScriptHTMLAttributes } from "react";

declare global {
 interface Window {
   plausible: {
     (event: string, eventProps?: Record<string, any>): void;
     q?: any[];
   };
 }
}

interface PlausibleScriptProps extends ScriptHTMLAttributes<HTMLScriptElement> {
 domain: string;
 src: string;
}

export function PlausibleScript({
 domain,
 src,
 ...props
}: PlausibleScriptProps) {
 return (
   <>
     <script defer data-domain={domain} src={src} {...props} />
     <script
       {...props}
       src={undefined}
       dangerouslySetInnerHTML={{
         __html: `window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`,
       }}
     />
   </>
 );
}
