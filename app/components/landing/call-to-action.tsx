import { GitHubLogoIcon } from "@radix-ui/react-icons";

import { buttonVariants } from "../ui/button";

const value = {
  subjectLine: "Start a project with One Piece Stack today.",
  subtitle:
    "One Piece Stack is open source and powered by open source software.",
  btnText: "Github",
  btnLink: "https://github.com/aadi-thedevguy/one-piece-stack",
};

export default function CTA() {
  return (
    <article className="mx-auto my-32 max-w-7xl rounded-xl bg-accent px-12 py-20 text-center text-accent-foreground lg:px-24">
      <div className="flex flex-col items-center">
        <h2 className="font-bold text-3xl text-secondary-foreground sm:text-4xl">
          {value.subjectLine}
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-secondary-foreground leading-8">
          {value.subtitle}
        </p>
        <div className="mt-10">
          <a
            className={buttonVariants({
              variant: "default",
              size: "lg",
            })}
            href={value.btnLink}
            rel="noreferrer"
            target="_blank"
          >
            {value.btnText}
            <GitHubLogoIcon className="ml-3 h-5 w-5" />
          </a>
        </div>
      </div>
    </article>
  );
}
