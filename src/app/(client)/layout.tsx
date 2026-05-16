import { redirect } from "next/navigation";

import { getServerSessionUser } from "~/features/auth/server";
import { ClientShell } from "~/features/restaurant/components/ClientShell";

export default async function ClientLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await getServerSessionUser();
	if (!user) redirect("/");
	if (user.role !== "client") {
		redirect(
			user.role === "restaurant_owner"
				? user.hasRestaurant
					? "/owner/overview"
					: "/owner/onboarding"
				: "/",
		);
	}
	return <ClientShell>{children}</ClientShell>;
}
