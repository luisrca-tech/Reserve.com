"use client";

import { ClientNavbar } from "./ClientNavbar";
import { RestaurantBrowseProvider } from "./RestaurantBrowseContext";

export function ClientShell({ children }: { children: React.ReactNode }) {
	return (
		<RestaurantBrowseProvider>
			<div className="flex min-h-screen flex-col">
				<ClientNavbar />
				{children}
			</div>
		</RestaurantBrowseProvider>
	);
}
