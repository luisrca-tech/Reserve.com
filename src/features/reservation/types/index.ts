import type { Reservation } from "~/server/db/schema/types";

export type { Reservation } from "~/server/db/schema/types";

/** View model the UI consumes for history / dashboard lists. */
export interface ReservationView {
	id: string;
	restaurantId: string;
	restaurantName: string;
	restaurantImage: string | null;
	startTime: Date;
	endTime: Date;
	status: Reservation["status"];
	partySize: number;
	tableCount: number;
}
