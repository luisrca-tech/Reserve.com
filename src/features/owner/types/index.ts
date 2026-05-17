import type { Reservation } from "~/server/db/schema/types";

/**
 * A reservation for the owner panel, server-mapped: the guest's display
 * name + phone are resolved server-side (no client lookup), and lifecycle
 * expiry is already derived on read. Structurally a `CapacityReservation`
 * superset, so it feeds the shared availability domain directly.
 */
export interface OwnerReservationView {
	id: string;
	restaurantId: string;
	userId: string;
	guestName: string;
	guestPhone: string;
	startTime: Date;
	endTime: Date;
	status: Reservation["status"];
	partySize: number;
	tableCount: number;
}
