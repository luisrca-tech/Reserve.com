import { redirect } from "next/navigation";

import { getServerSessionUser } from "~/features/auth/server";

/**
 * Dashboard gate: an owner that has not completed onboarding is forced
 * back to /restaurant/onboarding before any dashboard route renders.
 */
export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await getServerSessionUser();
	if (!user || user.role !== "restaurant_owner") redirect("/");
	if (!user.hasRestaurant) redirect("/restaurant/onboarding");
	return children;
}
