import { CircleCheckBig, Home } from "lucide-react";
import { Link } from "react-router";
import { buttonVariants } from "~/components/ui/button";

export default function PaymentSuccess() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="mx-auto max-w-lg rounded-lg bg-card p-8 text-center shadow-lg">
        <CircleCheckBig className="mx-auto mb-4 h-24 w-24 text-green-500" />
        <h1 className="mb-4 font-bold text-3xl">Subscription Successful!</h1>
        <p className="mb-6 text-muted-foreground">
          Thank you for subscribing. You'll receive a confirmation email in your
          inbox shortly.
        </p>
        <Link className={buttonVariants({ variant: "link" })} to="/">
          <span>Go to Home</span>
          <Home className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
