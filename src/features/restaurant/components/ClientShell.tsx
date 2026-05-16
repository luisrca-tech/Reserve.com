"use client";

import { ReservationStoreProvider } from "~/features/reservation/components/ReservationStoreContext";
import { ClientNavbar } from "./ClientNavbar";
import { RestaurantBrowseProvider } from "./RestaurantBrowseContext";

export function ClientShell({ children }: { children: React.ReactNode }) {
	return (
		<ReservationStoreProvider>
			<RestaurantBrowseProvider>
				<div className="flex min-h-screen flex-col">
					<ClientNavbar />
					{children}
				</div>
			</RestaurantBrowseProvider>
		</ReservationStoreProvider>
	);
}
