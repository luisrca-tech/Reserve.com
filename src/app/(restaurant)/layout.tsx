import { redirect } from "next/navigation";

import { getServerSessionUser } from "~/features/auth/server";

export default async function RestaurantLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await getServerSessionUser();
	if (!user) redirect("/");
	if (user.role !== "restaurant_owner") redirect("/");
	return children;
}
