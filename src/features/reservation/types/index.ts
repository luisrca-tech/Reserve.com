import type { Reservation } from "~/server/db/schema/types";

export type { Reservation } from "~/server/db/schema/types";

/**
 * Mock-only schema delta: `partySize` and `tableCount` are NOT yet in the
 * Drizzle `reservation` table (documented backend debt). The mock layer
 * carries them so capacity math can be built ahead of the migration.
 */
export interface MockReservation extends Reservation {
	partySize: number;
	tableCount: number;
}

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
