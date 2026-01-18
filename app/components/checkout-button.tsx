import { Form, useNavigation } from "react-router";
import type { Interval } from "~/constants/index";
import { Button } from "./ui/button";

type CheckoutButtonProps = {
  planId: string;
  planInterval: string | Interval;
  currentPlanId: string | null;
  planName: string;
  disabled?: boolean;
};

export function CheckoutButton({
  planId,
  planInterval,
  currentPlanId,
  planName,
  disabled,
}: CheckoutButtonProps) {
  const navigation = useNavigation();
  const isCurrentPlan = currentPlanId === planId;
  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formData?.get("planId") === planId;

  if (isCurrentPlan) {
    return (
      <Button className="w-full" disabled variant="outline">
        Current Plan
      </Button>
    );
  }

  return (
    <Form action="/plans" method="post">
      <input name="planId" type="hidden" value={planId} />
      <input name="interval" type="hidden" value={planInterval} />
      <Button
        className="w-full"
        disabled={disabled || isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Loading..." : `Subscribe to ${planName}`}
      </Button>
    </Form>
  );
}
