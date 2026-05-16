import { redirect } from "next/navigation";

import { getServerSessionUser } from "~/features/auth/server";
import { OnboardingFlow } from "~/features/restaurant/components/OnboardingFlow";

/**
 * Onboarding lives outside the `(panel)` group so it stays reachable for an
 * owner-without-restaurant. An owner that already has a restaurant has
 * nothing to do here — send them straight to the dashboard.
 */
export default async function OnboardingPage() {
	const user = await getServerSessionUser();
	if (user?.hasRestaurant) redirect("/owner/overview");
	return <OnboardingFlow />;
}
