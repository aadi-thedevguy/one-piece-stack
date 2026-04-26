import { Link } from "react-router";
import { Button } from "../ui/button";

export default function Navbar({ children }: { children: React.ReactNode }) {
  return (
    <header className="top-0 z-50 mb-12 flex h-20 w-screen flex-wrap items-center justify-between px-4 py-4 shadow-gray-200 shadow-xs backdrop-blur-sm supports-backdrop-blur:bg-white/60 sm:px-6 lg:px-8 dark:bg-transparent dark:shadow-gray-700">
      <div className="flex items-center">
        <Link aria-label="Home page" to="/">
          <Button size="lg" variant="link">
            Home{" "}
          </Button>
        </Link>
        <Link aria-label="Pricing Page" to="/plans">
          <Button size="lg" variant="link">
            Pricing
          </Button>
        </Link>
      </div>
      <div className="flex grow items-center justify-end gap-4">{children}</div>
    </header>
  );
}
