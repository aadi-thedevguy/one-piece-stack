// This is called a "splat route" and as it's in the root `/app/routes/`
// directory, it's a catchall. If no other routes match, this one will and we
// can know that the user is hitting a URL that doesn't exist. By throwing a
// 404 from the loader, we can force the error boundary to render which will
// ensure the user gets the right status code and we can display a nicer error
// message for them than the Remix and/or browser default.

import { ArrowRightIcon } from "lucide-react";
import { Img } from "openimg/react";
import { Link, useLocation } from "react-router";
import { GeneralErrorBoundary } from "~/components/layout/error-boundary";
import { buttonVariants } from "~/components/ui/button";

export async function loader() {
  throw new Response("Not found", { status: 404 });
}

export default function NotFound() {
  // due to the loader, this component will never be rendered, but we'll return
  // the error boundary just in case.
  return <ErrorBoundary />;
}

export function ErrorBoundary() {
  const location = useLocation();
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        404: () => (
          <section className="overflow-hidden pt-45 pb-25 lg:pt-50 lg:pb-32.5 xl:pt-55 xl:pb-37.5">
            <div className="mx-auto max-w-[518px] text-center">
              <Img
                alt="404"
                className="mx-auto mb-8"
                height={400}
                src="/images/shape/404.svg"
                width={400}
              />

              <h2 className="mb-5 font-semibold text-2xl md:text-4xl">
                This Page {location.pathname} Does Not Exist
              </h2>
              <p className="mb-8">
                The page you were looking for appears to have been moved,
                deleted or does not exist.
              </p>

              <Link
                className={buttonVariants({
                  variant: "secondary",
                })}
                to="/"
              >
                Return to Home
                <ArrowRightIcon className="ml-1 h-5 w-5" />
              </Link>
            </div>
          </section>
        ),
      }}
    />
  );
}
