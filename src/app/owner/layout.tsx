import { redirect } from "next/navigation";

import { getServerSessionUser } from "~/features/auth/server";

/** Owner role gate: only restaurant owners may enter the owner area. */
export default async function OwnerLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await getServerSessionUser();
	if (!user) redirect("/");
	if (user.role !== "restaurant_owner") redirect("/");
	return children;
}
