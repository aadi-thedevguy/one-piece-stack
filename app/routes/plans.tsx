import { CheckIcon } from "lucide-react";
import { useState } from "react";
import {
  type ActionFunctionArgs,
  data,
  Link,
  type LoaderFunctionArgs,
  redirect,
  useLoaderData,
} from "react-router";
import { CheckoutButton } from "~/components/checkout-button";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { CURRENCIES, INTERVALS, type Interval } from "~/constants/index";
import { getUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db.server";
import { getDefaultCurrency } from "~/lib/locales";
import { dodoClient } from "~/lib/payment.server";
import { cn } from "~/lib/utils";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await getUserId(request);
  if (!userId) {
    return redirect("/login?redirectTo=/plans");
  }
  const formData = await request.formData();
  const planSlug = formData.get("planId") as string;
  const interval = formData.get("interval") as string;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, name: true, id: true },
  });

  const defaultCurrency = getDefaultCurrency(request);

  const price = await prisma.price.findFirst({
    where: {
      plan: {
        planID: planSlug,
      },
      interval,
      currency: defaultCurrency,
    },
    select: {
      priceID: true,
    },
  });

  if (!price?.priceID) {
    throw new Error(
      "Price not found for selected plan, interval, and currency."
    );
  }

  const session = await dodoClient.checkoutSessions.create({
    customer: {
      email: user.email,
      name: user.name ?? undefined,
    },
    billing_address: {
      street: "123 Main St",
      city: "New York",
      country: "US",
      state: "NY",
      zipcode: "10001",
    },
    product_cart: [
      {
        product_id: price.priceID,
        quantity: 1,
      },
    ],
    return_url: `${process.env.SERVER_URL}/payment/success`,
  });

  if (!session.checkout_url) {
    throw new Error("Failed to create payment link");
  }

  return redirect(session.checkout_url);
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  const plans = await prisma.plan.findMany({
    include: {
      prices: true,
      features: true,
    },
    orderBy: {
      prices: {
        _count: "asc",
      },
    },
  });

  const defaultCurrency = getDefaultCurrency(request);

  if (!userId) {
    return data({
      user: null,
      subscription: null,
      defaultCurrency,
      plans,
    });
  }
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      subscription: {
        include: {
          plan: true,
          price: true,
        },
      },
    },
  });

  return data({
    user,
    defaultCurrency,
    plans,
  });
}

export default function Plans() {
  const { user, defaultCurrency, plans } = useLoaderData<typeof loader>();
  const [planInterval, setPlanInterval] = useState<Interval | string>(
    user?.subscription?.interval || INTERVALS.MONTH
  );

  return (
    <section>
      <div className="mx-auto max-w-(--breakpoint-xl) px-4 py-8 lg:px-6 lg:py-16">
        <div className="mx-auto mb-8 max-w-(--breakpoint-md) text-center lg:mb-12">
          <h2 className="mb-4 font-extrabold text-4xl tracking-tight">
            Designed for business teams like yours
          </h2>
          <p className="mb-5 font-light text-gray-500 sm:text-xl">
            Here at Flowbite we focus on markets where technology, innovation,
            and capital can unlock long-term value and drive economic growth
          </p>

          <div className="flex flex-col items-center justify-center gap-4">
            <Label htmlFor="plan-toggle">
              {planInterval === INTERVALS.MONTH ? "Monthly" : "Yearly"}
            </Label>
            <Switch
              checked={planInterval === INTERVALS.YEAR}
              id="plan-toggle"
              onCheckedChange={() =>
                setPlanInterval((prev) =>
                  prev === INTERVALS.MONTH ? INTERVALS.YEAR : INTERVALS.MONTH
                )
              }
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-6 space-y-8 lg:space-y-0">
          {plans.map((plan) => {
            const price = plan.prices.find(
              (p) =>
                p.interval === planInterval && p.currency === defaultCurrency
            );
            const priceAmount = price ? price.amount / 100 : 0;
            const isActive =
              user?.subscription?.planId === plan.id &&
              user?.subscription?.interval === planInterval;

            return (
              <div
                className={cn(
                  "relative mx-auto flex min-w-2xs max-w-lg flex-col rounded-xl border border-border p-6 text-center shadow-sm xl:p-8",
                  {
                    "border-yellow-500 dark:border-yellow-300": plan.isPopular,
                    "border-green-500 dark:border-green-400": isActive,
                  }
                )}
                key={plan.planID}
              >
                {plan.isPopular && !isActive && (
                  <div className="-right-3.5 -rotate-90 absolute top-5 rounded-tl-full rounded-bl-full bg-yellow-500 px-3 py-2 font-medium text-black text-xs uppercase dark:bg-yellow-300">
                    popular
                  </div>
                )}
                {isActive && (
                  <div className="-right-3.5 -rotate-90 absolute top-5 rounded-tl-full rounded-bl-full bg-green-500 px-3 py-2 font-medium text-white text-xs uppercase dark:bg-green-400">
                    Active
                  </div>
                )}
                <h3 className="mb-4 font-semibold text-2xl">{plan.name}</h3>
                <p className="font-light text-gray-500 sm:text-lg">
                  {plan.description}
                </p>

                <h5 className="my-4 flex items-center justify-center font-bold text-5xl">
                  {defaultCurrency === CURRENCIES.EUR ? "€" : "$"}
                  {priceAmount}
                  <small className="relative top-2 left-1 text-gray-400 text-lg">
                    {planInterval === INTERVALS.MONTH ? "/mo" : "/yr"}
                  </small>
                </h5>
                <ul className="my-8 space-y-4 text-left">
                  {plan.features.map((feature) => (
                    <li
                      className="flex items-center space-x-3"
                      key={feature.id}
                    >
                      <CheckIcon className="text-green-300" />
                      <span>{feature.description}</span>
                    </li>
                  ))}
                </ul>
                {user ? (
                  isActive ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <CheckoutButton
                      currentPlanId={user.subscription?.planId ?? null}
                      disabled={isActive}
                      planId={plan.planID}
                      planInterval={planInterval}
                      planName={plan.name}
                    />
                  )
                ) : (
                  <Button asChild>
                    <Link to="/login?redirectTo=/plans">
                      Login to Subscribe
                    </Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
