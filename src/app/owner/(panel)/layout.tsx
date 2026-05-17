import { redirect } from "next/navigation";

import { getServerSessionUser } from "~/features/auth/server";
import { OwnerShell } from "~/features/owner/components/OwnerShell";
import { api, HydrateClient } from "~/trpc/server";

/**
 * Dashboard gate: an owner that has not completed onboarding is forced
 * back to /owner/onboarding before any panel route renders. Onboarding
 * itself lives outside this group, so it stays reachable.
 *
 * Every panel route reads the owner's restaurant + reservations, so both
 * are prefetched once here into the hydration boundary that wraps the
 * whole shell — the client store consumes the warm cache.
 */
export default async function OwnerPanelLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await getServerSessionUser();
	if (!user || user.role !== "restaurant_owner") redirect("/");
	if (!user.hasRestaurant) redirect("/owner/onboarding");

	void api.owner.restaurant.prefetch();
	void api.owner.reservations.prefetch();

	return (
		<HydrateClient>
			<OwnerShell>{children}</OwnerShell>
		</HydrateClient>
	);
}
