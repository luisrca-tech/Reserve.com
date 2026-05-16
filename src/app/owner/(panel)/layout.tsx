import { redirect } from "next/navigation";

import { getServerSessionUser } from "~/features/auth/server";
import { OwnerShell } from "~/features/owner/components/OwnerShell";

/**
 * Dashboard gate: an owner that has not completed onboarding is forced
 * back to /owner/onboarding before any panel route renders. Onboarding
 * itself lives outside this group, so it stays reachable.
 */
export default async function OwnerPanelLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await getServerSessionUser();
	if (!user || user.role !== "restaurant_owner") redirect("/");
	if (!user.hasRestaurant) redirect("/owner/onboarding");
	return <OwnerShell>{children}</OwnerShell>;
}
