import { GitHubLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons";
import { Link } from "react-router";
import { cn } from "~/lib/utils";
import { buttonVariants } from "../ui/button";

const FOOTER_SOCIALS = [
  {
    ariaLabel: "Github Repository",
    icon: <GitHubLogoIcon className="h-6 w-6" />,
    href: "https://github.com/aadi-thedevguy/one-piece-stack",
  },
  {
    ariaLabel: "Twitter Profile",
    icon: <TwitterLogoIcon className="h-6 w-6" />,
    href: "https://twitter.com/Aadi__khare",
  },
];

const LINKS = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Pricing",
    href: "/plans",
  },
  {
    label: "Profile",
    href: "/settings/profile",
  },
];
const LEGAL = [
  {
    label: "Terms of Service",
    href: "/tos",
  },
  {
    label: "Privacy Policy",
    href: "/privacy",
  },
];

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <footer className="mt-24 border-border border-t bg-secondary">
      <div className="mx-auto flex max-w-(--breakpoint-xl) flex-wrap gap-8 px-4 py-20 md:px-8 lg:justify-between lg:gap-0 lg:py-25">
        <div className="w-1/2 lg:w-1/4">
          {/* <Link to="/" className="relative">
						<Skull className='w-10 h-10 text-secondary-foreground' />
					</Link> */}
          {children}

          <p className="mt-5 mb-10">
            &copy; {new Date().getFullYear()}{" "}
            <a
              className={cn(buttonVariants({ variant: "link" }), "mx-0 px-0")}
              href="https://thedevguy.in"
              rel="noreferrer noopener"
            >
              One Piece Stack.
            </a>{" "}
            All rights reserved
          </p>

          <p className="mb-1.5 text-card-foreground uppercase tracking-[5px]">
            contact
          </p>
          <a
            className={buttonVariants({ variant: "link" })}
            href="mailto:support@thedevguy.in"
          >
            <span className="text-xl">support@thedevguy.in</span>
          </a>
        </div>

        <div className="flex w-full flex-col gap-8 md:flex-row md:justify-between md:gap-0 lg:w-2/3 xl:w-7/12">
          <div>
            <h4 className="mb-9 font-medium text-accent-foreground text-xl">
              Quick Links
            </h4>
            <ul>
              {LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    className={buttonVariants({
                      variant: "link",
                    })}
                    to={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-9 font-medium text-accent-foreground text-xl">
              Legal
            </h4>
            <ul>
              {LEGAL.map((item) => (
                <li key={item.label}>
                  <Link
                    className={buttonVariants({
                      variant: "link",
                    })}
                    to={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-9 font-medium text-accent-foreground text-xl">
              Socials
            </h4>
            <ul>
              {FOOTER_SOCIALS.map((item) => (
                <li key={item.ariaLabel}>
                  <Link
                    className={buttonVariants({
                      variant: "ghost",
                      size: "icon",
                    })}
                    title={item.ariaLabel}
                    to={item.href}
                  >
                    {item.icon}
                    {/* {item.ariaLabel} */}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
